import { auth } from '@clerk/nextjs/server';
import { ZodError, z } from 'zod';

import { db } from '@/lib/db';

const approveParamsSchema = z.object({
  id: z.string().min(1),
  requestId: z.string().min(1),
});

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
): Promise<Response> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { id, requestId } = approveParamsSchema.parse(await params);

    const room = await db.room.findUnique({
      where: { id },
      select: {
        id: true,
        hostId: true,
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
      return Response.json({ error: 'Only the host can approve requests.' }, { status: 403 });
    }

    const request = await db.invitation.findFirst({
      where: {
        id: requestId,
        roomId: room.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!request) {
      return Response.json({ error: 'Request not found.' }, { status: 404 });
    }

    if (request.status === 'approved') {
      return Response.json({ status: 'approved' });
    }

    await db.invitation.update({
      where: { id: request.id },
      data: { status: 'approved' },
    });

    return Response.json({ status: 'approved' });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: 'Invalid parameters.', details: error.flatten() }, { status: 400 });
    }

    console.error('Failed to approve request:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
