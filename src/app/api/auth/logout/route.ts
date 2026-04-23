import { logoutCurrentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await logoutCurrentSession();

  return Response.json({
    ok: true,
  });
}
