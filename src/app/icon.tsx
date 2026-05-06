import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Browser tab favicons need solid contrast against most browser chrome
// (which is typically white/grey/dark). Putting an orange J on a fully
// transparent or cream background disappears in many tab bars. We use a
// soft orange ring on cream so the mark stays readable in light tabs and
// keeps the JS warmth.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F4F1DB",
          color: "#FF6600",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          fontSize: 24,
          fontWeight: 700,
          borderRadius: 7,
          fontStyle: "italic",
        }}
      >
        J
      </div>
    ),
    size
  );
}
