const buildTimestamp = new Date().toISOString();

export const dynamic = "force-static";

export async function GET() {
  return Response.json({
    ok: true,
    mode: "static-export",
    schedulerEnabled: false,
    message:
      "Der serverseitige Wochen-Scheduler ist im GitHub-Pages-Zielpfad deaktiviert. Neue lokale Planungsaktionen folgen später direkt im Gerät.",
    timestamp: buildTimestamp,
  });
}
