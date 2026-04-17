import { ImageResponse } from "next/og";

export const contentType = "image/png";

export const size = {
  width: 512,
  height: 512,
};

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
          background: "radial-gradient(circle at 30% 25%, #7e73ff 0%, #4d3ceb 45%, #111118 100%)",
          borderRadius: 120,
          color: "white",
          fontSize: 220,
          fontWeight: 700,
          fontFamily: "Inter, sans-serif",
        }}
      >
        P
      </div>
    ),
    {
      ...size,
    },
  );
}
