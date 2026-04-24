import { cache } from "react";

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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeDisplayName(displayName: string | null | undefined) {
  const value = displayName?.trim();
  return value ? value : null;
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

const LOCAL_PWA_USER: AuthenticatedUser = {
  id: 1,
  email: "lokal@plan-und-pfanne.app",
  displayName: "Plan und Pfanne",
};

export async function requestLoginCode(input: {
  email: string;
  displayName?: string | null;
}) {
  const email = normalizeEmail(input.email);
  const displayName = normalizeDisplayName(input.displayName);

  return {
    debugCode: displayName ? "PWA-LOKAL" : "OHNE-LOGIN",
    deliveryMode: "development",
    email,
    expiresInMinutes: 0,
  } satisfies SendCodeResult & { email: string; expiresInMinutes: number };
}

export async function verifyLoginCode(input: {
  email: string;
  code: string;
  displayName?: string | null;
}) {
  void input;
}

export const getCurrentUser = cache(async () => LOCAL_PWA_USER);

export async function requireUser(nextPath?: string) {
  void nextPath;
  return getCurrentUser();
}

export async function redirectIfAuthenticated() {
  return undefined;
}

export async function logoutCurrentSession() {
  return undefined;
}

export function getSafeNextPath(nextPath: string | null | undefined) {
  return sanitizeNextPath(nextPath);
}
