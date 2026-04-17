export const dynamic = 'force-dynamic';
import { auth, currentUser } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';
import { ZodError, z } from 'zod';

import { db } from '@/lib/db';
import { generateToken } from '@/lib/livekit';

const tokenRequestSchema = z.object({
  roomId: z.string().min(1),
  identity: z.string().trim().min(1).max(200).optional(),
  isHost: z.boolean().optional(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const body = tokenRequestSchema.parse(await req.json());

    const room = await db.room.findUnique({
      where: { id: body.roomId },
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

    if (!room.isActive) {
      return Response.json({ error: 'Room is not active.' }, { status: 400 });
    }

    const { userId } = await auth();
    const clerkUser = userId ? await currentUser() : null;
    const hostRequested = body.isHost === true;

    let isHost = false;
    let identity: string;

    if (hostRequested) {
      if (!userId) {
        return Response.json({ error: 'Authentication required for host token.' }, { status: 401 });
      }

      const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!dbUser || dbUser.id !== room.hostId) {
        return Response.json({ error: 'Only the host can request a host token.' }, { status: 403 });
      }

      isHost = true;
      identity = body.identity ?? userId;
    } else {
      if (!userId) {
        return Response.json(
          { error: 'Sign in is required before joining this room.' },
          { status: 401 },
        );
      }

      const email = clerkUser?.primaryEmailAddress?.emailAddress;

      if (!email) {
        return Response.json({ error: 'No primary email found for this account.' }, { status: 400 });
      }

      const approvedRequest = await db.invitation.findFirst({
        where: {
          roomId: room.id,
          email,
          status: 'approved',
        },
        select: { id: true },
      });

      if (!approvedRequest) {
        return Response.json(
          { error: 'Host approval is required before joining this room.', code: 'APPROVAL_REQUIRED' },
          { status: 403 },
        );
      }

      identity = body.identity ?? userId ?? `guest-${uuidv4()}`;
    }

    const token = await generateToken(room.liveKitRoomId, identity, isHost);

    return Response.json({ token, identity, isHost });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: 'Invalid input.', details: error.flatten() }, { status: 400 });
    }

    console.error('Failed to generate LiveKit token:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
