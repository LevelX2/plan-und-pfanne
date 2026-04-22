import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
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
          borderRadius: "36px",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: "-0.08em" }}>GF</div>
      </div>
    ),
    size,
  );
}
