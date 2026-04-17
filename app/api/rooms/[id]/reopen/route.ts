import { auth } from '@clerk/nextjs/server';
import { ZodError, z } from 'zod';

import { db } from '@/lib/db';
import { getRoomServiceClient } from '@/lib/livekit';

const roomParamsSchema = z.object({
  id: z.string().min(1),
});

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
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
        isActive: true,
        liveKitRoomId: true,
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
      return Response.json({ error: 'Only the host can reopen this room.' }, { status: 403 });
    }

    if (room.isActive) {
      return Response.json({ status: 'already-active' });
    }

    const roomServiceClient = getRoomServiceClient();

    try {
      await roomServiceClient.createRoom({ name: room.liveKitRoomId });
    } catch (error) {
      console.warn('LiveKit room creation warning while reopening room:', error);
    }

    const updatedRoom = await db.room.update({
      where: { id: room.id },
      data: {
        isActive: true,
        endedAt: null,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        endedAt: true,
      },
    });

    return Response.json({ room: updatedRoom });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: 'Invalid room ID.', details: error.flatten() }, { status: 400 });
    }

    console.error('Failed to reopen room:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
