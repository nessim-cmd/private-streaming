import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { generatePresignedUrl } from "@/lib/s3";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const rawRecordings = await db.recording.findMany({
      where: {
        room: {
          hostId: user.id,
        },
      },
      include: {
        room: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Generate presigned URLs for private storage
    const recordings = await Promise.all(
      rawRecordings.map(async (rec) => {
        if (rec.status === "completed" && rec.key && !rec.url) {
          const presignedUrl = await generatePresignedUrl(rec.key);
          return { ...rec, url: presignedUrl };
        }
        
        // If url is already set (public) or if it's still processing
        if (rec.status === "completed" && rec.key) {
            const presignedUrl = await generatePresignedUrl(rec.key);
            return { ...rec, url: presignedUrl };
        }

        return rec;
      })
    );

    return Response.json({ recordings });
  } catch (error) {
    console.error("Failed to fetch recordings:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
