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
          background: "#F2E5C2",
          display: "flex",
          flexDirection: "column",
          padding: "80px 90px",
          fontFamily: "Georgia, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              fontSize: 56,
              color: "#E85A1B",
              fontWeight: 700,
              fontStyle: "italic",
              fontFamily: "Georgia, serif",
              lineHeight: 1,
            }}
          >
            J
          </span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#16140F",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            jumpstart
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p
            style={{
              fontSize: 16,
              color: "#E85A1B",
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
              fontSize: 78,
              lineHeight: 1.02,
              fontWeight: 400,
              color: "#16140F",
              margin: "20px 0 0 0",
              maxWidth: 1000,
              fontFamily: "Georgia, serif",
              letterSpacing: -0.02,
            }}
          >
            One founder match <em style={{ color: "#E85A1B" }}>every other day</em>.
          </h1>
          <p
            style={{
              fontSize: 30,
              color: "#463325",
              margin: "24px 0 0 0",
              maxWidth: 920,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            The unofficial global attendee graph for YC Startup School 2026.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <span style={{ fontSize: 18, color: "#463325" }}>
            Verified attendees only. Not affiliated with Y Combinator.
          </span>
          <span style={{ fontSize: 18, fontWeight: 600, color: "#E85A1B" }}>
            jumpstart →
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
