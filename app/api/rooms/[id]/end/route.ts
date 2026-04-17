import { auth } from '@clerk/nextjs/server';
import { ZodError, z } from 'zod';

import { db } from '@/lib/db';
import { getRoomServiceClient } from '@/lib/livekit';

const roomParamsSchema = z.object({
  id: z.string().min(1),
});

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { id } = roomParamsSchema.parse(await params);

    const room = await db.room.findUnique({
      where: { id },
      select: {
        id: true,
        hostId: true,
        liveKitRoomId: true,
        isActive: true,
      },
    });

    if (!room) {
      return Response.json({ error: 'Room not found.' }, { status: 404 });
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!dbUser || dbUser.id !== room.hostId) {
      return Response.json({ error: 'Only the host can end this room.' }, { status: 403 });
    }

    if (!room.isActive) {
      return Response.json({ error: 'Room is already ended.' }, { status: 400 });
    }

    const roomServiceClient = getRoomServiceClient();

    await roomServiceClient.deleteRoom(room.liveKitRoomId).catch((error: unknown) => {
      console.error('Failed to delete LiveKit room:', error);
    });

    const updatedRoom = await db.room.update({
      where: { id: room.id },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        hostId: true,
        liveKitRoomId: true,
        isActive: true,
        createdAt: true,
        endedAt: true,
      },
    });

    return Response.json({ room: updatedRoom });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: 'Invalid room ID.', details: error.flatten() }, { status: 400 });
    }

    console.error('Failed to end room:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
