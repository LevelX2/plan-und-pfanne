const buildTimestamp = new Date().toISOString();

export const dynamic = "force-static";

export async function GET() {
  return Response.json({
    ok: true,
    mode: "static-export",
    schedulerEnabled: false,
    message:
      "Dieser Endpunkt plant keine Wochen mehr zentral. Die App erstellt Wochenpläne direkt beim Öffnen oder auf Knopfdruck.",
    timestamp: buildTimestamp,
  });
}
