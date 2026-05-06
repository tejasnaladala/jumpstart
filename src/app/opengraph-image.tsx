import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Jumpstart for SS 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FAFAF7",
          display: "flex",
          flexDirection: "column",
          padding: "80px 90px",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "#1A1A1A",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#C45612",
              fontSize: 38,
              fontWeight: 600,
            }}
          >
            J
          </div>
          <span style={{ fontSize: 28, fontWeight: 600, color: "#1A1A1A" }}>
            jumpstart
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p
            style={{
              fontSize: 16,
              color: "#C45612",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              margin: 0,
            }}
          >
            Built for the SS 2026 cohort
          </p>
          <h1
            style={{
              fontSize: 72,
              lineHeight: 1.05,
              fontWeight: 600,
              color: "#1A1A1A",
              margin: "20px 0 0 0",
              maxWidth: 950,
            }}
          >
            Three founder matches every Wednesday.
          </h1>
          <p style={{ fontSize: 32, color: "#6B6B6B", margin: "24px 0 0 0", maxWidth: 900 }}>
            The unofficial global attendee graph for YC Startup School 2026.
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ fontSize: 18, color: "#6B6B6B" }}>
            Verified attendees only. Not affiliated with Y Combinator.
          </span>
          <span style={{ fontSize: 18, fontWeight: 600, color: "#C45612" }}>
            jumpstart.app →
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
