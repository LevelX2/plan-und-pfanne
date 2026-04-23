const buildTimestamp = new Date().toISOString();

export const dynamic = "force-static";

export async function GET() {
  return Response.json({
    ok: true,
    mode: "static-export",
    message:
      "Die frühere Logout-API bleibt auf GitHub Pages nur noch als statischer Legacy-Hinweis bestehen.",
    timestamp: buildTimestamp,
  });
}
