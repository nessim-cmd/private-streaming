import { ImageResponse } from "next/og";

export const contentType = "image/png";

export const size = {
  width: 180,
  height: 180,
};

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
          background: "linear-gradient(145deg, #6e61ff 0%, #3f34d0 70%, #19192d 100%)",
          borderRadius: 40,
          color: "white",
          fontSize: 92,
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
