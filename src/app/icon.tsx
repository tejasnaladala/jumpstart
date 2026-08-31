import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Favicon: the J-hook + dot mark from the Logo component, in cream on
// orange. Inverted from the in-app logo (orange on cream) so the favicon
// has presence in both light and dark browser chrome.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#E85A1B",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={26} height={26} viewBox="0 0 32 32" fill="none">
          <path
            d="M9 12c0-1.5 1-2.5 2.5-2.5h6c2 0 3.5 1.5 3.5 3.5v6c0 3-2 4.5-4.5 4.5-2 0-3.5-1-3.5-3"
            stroke="#F2E5C2"
            strokeWidth={3.2}
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="22" cy="11" r={2.2} fill="#F2E5C2" />
        </svg>
      </div>
    ),
    size
  );
}
