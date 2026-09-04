import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          background: "#F5F3EF",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "#3B6B4F",
          }}
        >
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ fontSize: 72, fontWeight: 600, color: "#1F2937" }}>뭐라도해야지</div>
        <div style={{ fontSize: 32, color: "#4B5563" }}>완벽하지 않아도 돼. 오늘 뭐라도 하나만.</div>
      </div>
    ),
    size,
  );
}
