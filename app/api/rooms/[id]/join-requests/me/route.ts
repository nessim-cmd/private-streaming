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
      return Response.json({ status: 'signin-required' });
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

    if (room.host.clerkId === userId) {
      return Response.json({ status: 'approved' });
    }

    const clerkUser = await currentUser();
    const email = getPrimaryEmail(clerkUser);

    if (!email) {
      return Response.json({ status: 'signin-required' });
    }

    const latestRequest = await db.invitation.findFirst({
      where: {
        roomId: room.id,
        email,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        status: true,
      },
    });

    if (!latestRequest) {
      return Response.json({ status: 'not-requested' });
    }

    return Response.json({ status: latestRequest.status });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: 'Invalid room ID.', details: error.flatten() }, { status: 400 });
    }

    console.error('Failed to get request status:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
