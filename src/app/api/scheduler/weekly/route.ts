const buildTimestamp = new Date().toISOString();

export const dynamic = "force-static";

export async function GET() {
  return Response.json({
    ok: true,
    mode: "static-export",
    schedulerEnabled: false,
    message:
      "Dieser Endpunkt plant nicht mehr zentral. Die App erstellt Tagespläne lokal für frei gewählte Zeiträume.",
    timestamp: buildTimestamp,
  });
}
