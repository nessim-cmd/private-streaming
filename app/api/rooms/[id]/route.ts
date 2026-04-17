export const dynamic = 'force-dynamic';
import { auth } from '@clerk/nextjs/server';
import { ZodError, z } from 'zod';
import { db } from '@/lib/db';

const roomParamsSchema = z.object({
  id: z.string().min(1),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = roomParamsSchema.parse(await params);
    const { userId: clerkId } = await auth();

    const room = await db.room.findUnique({
      where: { id },
      include: {
        host: {
          select: { clerkId: true }
        }
      }
    });

    if (!room) {
      return Response.json({ error: 'Room not found.' }, { status: 404 });
    }

    const isHost = clerkId ? room.host.clerkId === clerkId : false;

    // Remove internal liveKitRoomId and host details from response for guests if necessary, 
    // but for now we keep it simple.
    return Response.json({ 
      room: {
        id: room.id,
        name: room.name,
        isActive: room.isActive,
        createdAt: room.createdAt,
        endedAt: room.endedAt,
      },
      isHost 
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: 'Invalid room ID.', details: error.flatten() }, { status: 400 });
    }

    console.error('Failed to load room:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
