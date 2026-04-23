const buildTimestamp = new Date().toISOString();

export const dynamic = "force-static";

export async function GET() {
  return Response.json({
    ok: true,
    mode: "static-export",
    timestamp: buildTimestamp,
  });
}
