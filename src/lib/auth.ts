import "server-only";

import crypto from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";

const SESSION_COOKIE_NAME = "plan-und-pfanne-session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const SESSION_REFRESH_INTERVAL_SECONDS = 60 * 60 * 12;
const AUTH_CODE_TTL_MINUTES = 15;
const MAX_AUTH_ATTEMPTS = 5;

type SessionUserRow = {
  id: number;
  email: string | null;
  display_name: string | null;
  verified_at: string | null;
  session_id: number;
  expires_at: string;
  last_seen_at: string;
};

type AuthChallengeRow = {
  id: number;
  display_name: string | null;
  code_hash: string;
  expires_at: string;
  attempt_count: number;
};

export type AuthenticatedUser = {
  id: number;
  email: string;
  displayName: string | null;
};

type SendCodeResult =
  | {
      debugCode: string;
      deliveryMode: "development";
    }
  | {
      debugCode: null;
      deliveryMode: "email";
    };

function nowIso() {
  return new Date().toISOString();
}

function isoAfterMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function isoAfterSeconds(seconds: number) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeDisplayName(displayName: string | null | undefined) {
  const value = displayName?.trim();
  return value ? value : null;
}

function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createLoginCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function createSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeNextPath(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }

  if (nextPath === "/anmelden" || nextPath.startsWith("/anmelden?")) {
    return "/";
  }

  return nextPath;
}

async function sendLoginCodeEmail(email: string, code: string): Promise<SendCodeResult> {
  const from = process.env.AUTH_FROM_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;

  if (from && apiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Dein Anmeldecode für Plan und Pfanne",
        text:
          `Dein Anmeldecode für Plan und Pfanne ist ${code}.\n\n` +
          `Der Code ist ${AUTH_CODE_TTL_MINUTES} Minuten gültig.`,
        html:
          `<p>Dein Anmeldecode für <strong>Plan und Pfanne</strong> ist ` +
          `<strong style="font-size:1.4rem">${escapeHtml(code)}</strong>.</p>` +
          `<p>Der Code ist ${AUTH_CODE_TTL_MINUTES} Minuten gültig.</p>`,
      }),
    });

    if (!response.ok) {
      throw new Error(`E-Mail-Versand fehlgeschlagen (${response.status}).`);
    }

    return {
      debugCode: null,
      deliveryMode: "email",
    };
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(`[auth] Anmeldecode fuer ${email}: ${code}`);

    return {
      debugCode: code,
      deliveryMode: "development",
    };
  }

  throw new Error("Der E-Mail-Versand ist noch nicht konfiguriert.");
}

function cleanupExpiredAuthArtifacts() {
  const db = getDb();
  const now = nowIso();

  db.prepare("DELETE FROM auth_challenges WHERE expires_at <= ? OR consumed_at IS NOT NULL").run(now);
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
}

function claimLegacyUserIfAvailable(email: string, displayName: string | null) {
  const db = getDb();
  const realUserCount = (
    db.prepare("SELECT COUNT(*) AS count FROM users WHERE email IS NOT NULL").get() as { count: number }
  ).count;

  if (realUserCount > 0) {
    return null;
  }

  const legacyUser = db
    .prepare("SELECT id FROM users WHERE email IS NULL ORDER BY id LIMIT 1")
    .get() as { id: number } | undefined;

  if (!legacyUser) {
    return null;
  }

  const now = nowIso();
  db.prepare(`
    UPDATE users
    SET
      email = @email,
      display_name = COALESCE(@displayName, display_name),
      verified_at = @verifiedAt,
      updated_at = @updatedAt,
      last_login_at = @lastLoginAt
    WHERE id = @id
  `).run({
    id: legacyUser.id,
    email,
    displayName,
    verifiedAt: now,
    updatedAt: now,
    lastLoginAt: now,
  });

  return legacyUser.id;
}

function upsertVerifiedUser(email: string, displayName: string | null) {
  const db = getDb();
  const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as
    | { id: number }
    | undefined;
  const now = nowIso();

  if (existingUser) {
    db.prepare(`
      UPDATE users
      SET
        display_name = COALESCE(display_name, @displayName),
        verified_at = COALESCE(verified_at, @verifiedAt),
        updated_at = @updatedAt,
        last_login_at = @lastLoginAt
      WHERE id = @id
    `).run({
      id: existingUser.id,
      displayName,
      verifiedAt: now,
      updatedAt: now,
      lastLoginAt: now,
    });

    return existingUser.id;
  }

  const claimedLegacyUserId = claimLegacyUserIfAvailable(email, displayName);
  if (claimedLegacyUserId) {
    return claimedLegacyUserId;
  }

  const insert = db.prepare(`
    INSERT INTO users (
      email,
      display_name,
      verified_at,
      created_at,
      updated_at,
      last_login_at
    ) VALUES (
      @email,
      @displayName,
      @verifiedAt,
      @createdAt,
      @updatedAt,
      @lastLoginAt
    )
  `).run({
    email,
    displayName,
    verifiedAt: now,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  });

  return Number(insert.lastInsertRowid);
}

async function persistSession(userId: number) {
  const db = getDb();
  const token = createSessionToken();
  const tokenHash = hashValue(token);
  const now = nowIso();
  const expiresAt = isoAfterSeconds(SESSION_MAX_AGE_SECONDS);
  const headerStore = await headers();

  db.prepare(`
    INSERT INTO sessions (
      user_id,
      token_hash,
      expires_at,
      created_at,
      last_seen_at,
      user_agent
    ) VALUES (
      @userId,
      @tokenHash,
      @expiresAt,
      @createdAt,
      @lastSeenAt,
      @userAgent
    )
  `).run({
    userId,
    tokenHash,
    expiresAt,
    createdAt: now,
    lastSeenAt: now,
    userAgent: headerStore.get("user-agent"),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function requestLoginCode(input: {
  email: string;
  displayName?: string | null;
}) {
  cleanupExpiredAuthArtifacts();

  const db = getDb();
  const email = normalizeEmail(input.email);
  const displayName = normalizeDisplayName(input.displayName);
  const existingRecentChallenge = db.prepare(`
    SELECT created_at
    FROM auth_challenges
    WHERE email = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(email) as { created_at: string } | undefined;

  if (existingRecentChallenge) {
    const secondsSinceLastRequest = Math.floor(
      (Date.now() - new Date(existingRecentChallenge.created_at).getTime()) / 1000,
    );

    if (secondsSinceLastRequest < 45) {
      throw new Error("Bitte warte kurz, bevor Du einen neuen Code anforderst.");
    }
  }

  const code = createLoginCode();
  const createdAt = nowIso();
  const expiresAt = isoAfterMinutes(AUTH_CODE_TTL_MINUTES);
  const insert = db.prepare(`
    INSERT INTO auth_challenges (
      email,
      display_name,
      code_hash,
      expires_at,
      created_at
    ) VALUES (
      @email,
      @displayName,
      @codeHash,
      @expiresAt,
      @createdAt
    )
  `).run({
    email,
    displayName,
    codeHash: hashValue(code),
    expiresAt,
    createdAt,
  });

  try {
    const delivery = await sendLoginCodeEmail(email, code);

    return {
      debugCode: delivery.debugCode,
      deliveryMode: delivery.deliveryMode,
      email,
      expiresInMinutes: AUTH_CODE_TTL_MINUTES,
    };
  } catch (error) {
    db.prepare("DELETE FROM auth_challenges WHERE id = ?").run(Number(insert.lastInsertRowid));
    throw error;
  }
}

export async function verifyLoginCode(input: {
  email: string;
  code: string;
  displayName?: string | null;
}) {
  cleanupExpiredAuthArtifacts();

  const db = getDb();
  const email = normalizeEmail(input.email);
  const submittedCodeHash = hashValue(input.code.trim());
  const challenge = db.prepare(`
    SELECT id, display_name, code_hash, expires_at, attempt_count
    FROM auth_challenges
    WHERE email = ?
      AND consumed_at IS NULL
      AND expires_at > ?
    ORDER BY id DESC
    LIMIT 1
  `).get(email, nowIso()) as AuthChallengeRow | undefined;

  if (!challenge) {
    throw new Error("Der Code ist ungültig oder bereits abgelaufen.");
  }

  if (challenge.attempt_count >= MAX_AUTH_ATTEMPTS) {
    throw new Error("Zu viele Fehlversuche. Bitte fordere einen neuen Code an.");
  }

  if (!hashesMatch(submittedCodeHash, challenge.code_hash)) {
    db.prepare(`
      UPDATE auth_challenges
      SET attempt_count = attempt_count + 1
      WHERE id = ?
    `).run(challenge.id);

    throw new Error("Der eingegebene Code passt nicht.");
  }

  const userId = upsertVerifiedUser(
    email,
    normalizeDisplayName(input.displayName) ?? normalizeDisplayName(challenge.display_name),
  );

  db.prepare(`
    UPDATE auth_challenges
    SET consumed_at = @consumedAt
    WHERE id = @id
  `).run({
    id: challenge.id,
    consumedAt: nowIso(),
  });

  await persistSession(userId);
}

async function loadCurrentUserFromSession() {
  cleanupExpiredAuthArtifacts();

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const db = getDb();
  const sessionUser = db.prepare(`
    SELECT
      users.id,
      users.email,
      users.display_name,
      users.verified_at,
      sessions.id AS session_id,
      sessions.expires_at,
      sessions.last_seen_at
    FROM sessions
    INNER JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ?
      AND sessions.expires_at > ?
    LIMIT 1
  `).get(hashValue(sessionToken), nowIso()) as SessionUserRow | undefined;

  if (!sessionUser || !sessionUser.email || !sessionUser.verified_at) {
    return null;
  }

  const elapsedSeconds = Math.floor(
    (Date.now() - new Date(sessionUser.last_seen_at).getTime()) / 1000,
  );

  if (elapsedSeconds >= SESSION_REFRESH_INTERVAL_SECONDS) {
    db.prepare(`
      UPDATE sessions
      SET
        last_seen_at = @lastSeenAt,
        expires_at = @expiresAt
      WHERE id = @id
    `).run({
      id: sessionUser.session_id,
      lastSeenAt: nowIso(),
      expiresAt: isoAfterSeconds(SESSION_MAX_AGE_SECONDS),
    });
  }

  return {
    id: sessionUser.id,
    email: sessionUser.email,
    displayName: sessionUser.display_name,
  } satisfies AuthenticatedUser;
}

export const getCurrentUser = cache(loadCurrentUserFromSession);

export async function requireUser(nextPath?: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/anmelden?next=${encodeURIComponent(sanitizeNextPath(nextPath))}`);
  }

  return user;
}

export async function redirectIfAuthenticated() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }
}

export async function logoutCurrentSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const db = getDb();

  if (sessionToken) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashValue(sessionToken));
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function getSafeNextPath(nextPath: string | null | undefined) {
  return sanitizeNextPath(nextPath);
}
