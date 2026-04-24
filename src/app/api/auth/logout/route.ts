const buildTimestamp = new Date().toISOString();

export const dynamic = "force-static";

export async function GET() {
  return Response.json({
    ok: true,
    mode: "static-export",
    message:
      "Dieser Endpunkt wird von der aktuellen App nicht mehr verwendet und bleibt nur aus Kompatibilitätsgründen erreichbar.",
    timestamp: buildTimestamp,
  });
}
