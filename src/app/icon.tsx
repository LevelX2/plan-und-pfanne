import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #1d6b4f 0%, #144c39 100%)",
          color: "#fff8ef",
          fontFamily: "Arial, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "44px",
            borderRadius: "120px",
            border: "16px solid rgba(255, 248, 239, 0.18)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <div style={{ fontSize: 176, fontWeight: 800, letterSpacing: "-0.08em" }}>GF</div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Rezepte
          </div>
        </div>
      </div>
    ),
    size,
  );
}
