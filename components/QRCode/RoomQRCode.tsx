import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface RoomQRCodeProps {
  value: string;
  size?: number;
}

export function RoomQRCode({ value, size = 128 }: RoomQRCodeProps) {
  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-white rounded-lg overflow-hidden">
      <QRCodeSVG 
        value={value} 
        size={size} 
        bgColor="#ffffff" 
        fgColor="#000000" 
        level="H"
        includeMargin={false}
      />
    </div>
  );
}
