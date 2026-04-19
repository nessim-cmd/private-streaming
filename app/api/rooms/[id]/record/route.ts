import { auth } from "@clerk/nextjs/server";
import { EncodedFileOutput, EncodedFileType } from "livekit-server-sdk";
import { db } from "@/lib/db";
import { getEgressClient } from "@/lib/livekit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const room = await db.room.findUnique({
      where: { id },
      include: { host: true },
    });

    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.host.clerkId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const action = body.action; // "start" or "stop"

    const egressClient = getEgressClient();

    if (action === "start") {
      // Check if already recording
      const existingRecording = await db.recording.findFirst({
        where: { roomId: id, status: "active" },
      });

      if (existingRecording) {
        return Response.json({ error: "Already recording" }, { status: 400 });
      }

      // Check for S3 config
      if (!process.env.S3_BUCKET_NAME || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
        return Response.json({ error: "S3 Storage is not configured in .env" }, { status: 500 });
      }

      const filepath = `recordings/${room.liveKitRoomId}-${Date.now()}.mp4`;
      
      let s3Endpoint = process.env.S3_ENDPOINT || "";
      if (s3Endpoint && !s3Endpoint.startsWith("http")) {
        s3Endpoint = `https://${s3Endpoint}`;
      }

      // Structure for modern LiveKit SDK Egress
      const output = {
        fileType: EncodedFileType.MP4,
        filepath: filepath,
        s3: {
          endpoint: s3Endpoint,
          accessKey: process.env.S3_ACCESS_KEY_ID || "",
          secret: process.env.S3_SECRET_ACCESS_KEY || "",
          bucket: process.env.S3_BUCKET_NAME || "",
        },
      } as any;

      const info = await egressClient.startRoomCompositeEgress(room.liveKitRoomId, output, {
        layout: "grid",
      });

      await db.recording.create({
        data: {
          roomId: id,
          egressId: info.egressId!,
          status: "active",
          key: filepath,
        },
      });

      return Response.json({ egressId: info.egressId });
    } else if (action === "stop") {
      const recording = await db.recording.findFirst({
        where: { roomId: id, status: "active" },
      });

      if (!recording) {
        return Response.json({ error: "Not recording" }, { status: 400 });
      }

      await egressClient.stopEgress(recording.egressId);

      await db.recording.update({
        where: { id: recording.id },
        data: { status: "completed" },
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Recording error:", error);
    return Response.json({ 
      error: "Recording failed", 
      details: error.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const recording = await db.recording.findFirst({
            where: { roomId: id, status: "active" },
            select: { id: true, status: true, egressId: true }
        });

        return Response.json({ isRecording: !!recording, recording });
    } catch (error) {
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
