import type { NextRequest } from "next/server";
import { generateScheduledWeekPlan } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: NextRequest) {
  const configuredSecret = process.env.SCHEDULER_SECRET;

  if (!configuredSecret) {
    return true;
  }

  const bearer = request.headers.get("authorization");
  const token = request.nextUrl.searchParams.get("token");

  return bearer === `Bearer ${configuredSecret}` || token === configuredSecret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json(
      {
        ok: false,
        error: "Nicht autorisiert.",
      },
      { status: 401 },
    );
  }

  const force = request.nextUrl.searchParams.get("force") === "1";
  const result = generateScheduledWeekPlan(force);

  return Response.json({
    ok: true,
    mode: force ? "force" : "scheduled",
    ...result,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
