import { auth, currentUser } from '@clerk/nextjs/server';
import { ZodError, z } from 'zod';

import { db } from '@/lib/db';

const roomParamsSchema = z.object({
  id: z.string().min(1),
});

function getPrimaryEmail(user: Awaited<ReturnType<typeof currentUser>>): string | null {
  if (!user?.primaryEmailAddressId) {
    return null;
  }

  const email = user.emailAddresses.find(
    (emailAddress) => emailAddress.id === user.primaryEmailAddressId,
  );

  return email?.emailAddress ?? null;
}

export async function GET(
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
      return Response.json({ error: 'Only the host can view join requests.' }, { status: 403 });
    }

    const requests = await db.invitation.findMany({
      where: {
        roomId: room.id,
        status: 'pending',
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    return Response.json({ requests });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: 'Invalid room ID.', details: error.flatten() }, { status: 400 });
    }

    console.error('Failed to list join requests:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'You must sign in before requesting access.' }, { status: 401 });
    }

    const { id } = roomParamsSchema.parse(await params);

    const room = await db.room.findUnique({
      where: { id },
      include: {
        host: {
          select: { clerkId: true },
        },
      },
    });

    if (!room) {
      return Response.json({ error: 'Room not found.' }, { status: 404 });
    }

    if (!room.isActive) {
      return Response.json({ error: 'Room is not active.' }, { status: 400 });
    }

    if (room.host.clerkId === userId) {
      return Response.json({ status: 'approved', reason: 'host' });
    }

    const clerkUser = await currentUser();
    const email = getPrimaryEmail(clerkUser);

    if (!email) {
      return Response.json({ error: 'No primary email found for this account.' }, { status: 400 });
    }

    const latestRequest = await db.invitation.findFirst({
      where: {
        roomId: room.id,
        email,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
      },
    });

    if (latestRequest?.status === 'approved') {
      return Response.json({ status: 'approved', requestId: latestRequest.id });
    }

    if (latestRequest?.status === 'pending') {
      return Response.json({ status: 'pending', requestId: latestRequest.id });
    }

    if (latestRequest?.status === 'rejected') {
      return Response.json({ status: 'rejected', requestId: latestRequest.id });
    }

    const created = await db.invitation.create({
      data: {
        roomId: room.id,
        email,
        status: 'pending',
      },
      select: {
        id: true,
        status: true,
      },
    });

    return Response.json({ status: created.status, requestId: created.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: 'Invalid room ID.', details: error.flatten() }, { status: 400 });
    }

    console.error('Failed to request room access:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
