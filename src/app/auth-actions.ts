"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type {
  RequestLoginCodeState,
  VerifyLoginCodeState,
} from "@/app/auth-form-state";
import { getSafeNextPath, requestLoginCode, verifyLoginCode } from "@/lib/auth";

const requestCodeSchema = z.object({
  email: z.string().trim().email("Bitte gib eine gültige E-Mail-Adresse ein."),
  displayName: z
    .string()
    .trim()
    .max(80, "Bitte nutze höchstens 80 Zeichen.")
    .optional()
    .or(z.literal("")),
  nextPath: z.string().optional(),
});

const verifyCodeSchema = z.object({
  email: z.string().trim().email("Bitte gib eine gültige E-Mail-Adresse ein."),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Bitte gib den sechsstelligen Code ein."),
  displayName: z
    .string()
    .trim()
    .max(80, "Bitte nutze höchstens 80 Zeichen.")
    .optional()
    .or(z.literal("")),
  nextPath: z.string().optional(),
});

export async function requestLoginCodeAction(
  _prevState: RequestLoginCodeState,
  formData: FormData,
): Promise<RequestLoginCodeState> {
  const parsed = requestCodeSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    nextPath: String(formData.get("nextPath") ?? "/"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.",
      email: String(formData.get("email") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      nextPath: getSafeNextPath(String(formData.get("nextPath") ?? "/")),
      debugCode: null,
    };
  }

  const nextPath = getSafeNextPath(parsed.data.nextPath);

  try {
    const result = await requestLoginCode({
      email: parsed.data.email,
      displayName: parsed.data.displayName,
    });

    return {
      status: "code-sent",
      message:
        result.deliveryMode === "email"
          ? `Wir haben Dir einen Anmeldecode an ${result.email} geschickt.`
          : `Der Entwicklungsmodus ist aktiv. Nutze den unten eingeblendeten Testcode.`,
      email: result.email,
      displayName: parsed.data.displayName ?? "",
      nextPath,
      debugCode: result.debugCode,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Der Anmeldecode konnte gerade nicht verschickt werden.",
      email: parsed.data.email,
      displayName: parsed.data.displayName ?? "",
      nextPath,
      debugCode: null,
    };
  }
}

export async function verifyLoginCodeAction(
  _prevState: VerifyLoginCodeState,
  formData: FormData,
): Promise<VerifyLoginCodeState> {
  const parsed = verifyCodeSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    code: String(formData.get("code") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    nextPath: String(formData.get("nextPath") ?? "/"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.",
    };
  }

  try {
    await verifyLoginCode({
      email: parsed.data.email,
      code: parsed.data.code,
      displayName: parsed.data.displayName,
    });
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Die Anmeldung konnte nicht bestätigt werden.",
    };
  }

  redirect(getSafeNextPath(parsed.data.nextPath));
}
