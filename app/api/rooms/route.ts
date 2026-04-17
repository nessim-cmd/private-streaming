export const dynamic = 'force-dynamic';
import { auth, currentUser } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';
import { ZodError, z } from 'zod';

import { db } from '@/lib/db';
import { getRoomServiceClient } from '@/lib/livekit';

const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

type ClerkUser = Awaited<ReturnType<typeof currentUser>>;

function resolvePrimaryEmailAddress(user: ClerkUser): string | null {
  if (!user || !user.primaryEmailAddressId) {
    return null;
  }

  const primaryEmailAddress = user.emailAddresses.find(
    (emailAddress) => emailAddress.id === user.primaryEmailAddressId
  );

  return primaryEmailAddress?.emailAddress ?? null;
}

async function ensureHostUser(clerkId: string): Promise<{ id: string }> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error('Authenticated Clerk user was not found.');
  }

  const primaryEmailAddress = resolvePrimaryEmailAddress(clerkUser);

  if (!primaryEmailAddress) {
    throw new Error('Authenticated Clerk user has no primary email address.');
  }

  return db.user.upsert({
    where: { clerkId },
    update: { email: primaryEmailAddress },
    create: {
      clerkId,
      email: primaryEmailAddress,
    },
    select: { id: true },
  });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = createRoomSchema.parse(await req.json());
    const hostUser = await ensureHostUser(userId);

    const liveKitRoomId = uuidv4();
    const roomServiceClient = getRoomServiceClient();

    await roomServiceClient.createRoom({ name: liveKitRoomId });

    let room;

    try {
      room = await db.room.create({
        data: {
          name: body.name,
          hostId: hostUser.id,
          liveKitRoomId,
          isActive: true,
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
    } catch (error) {
      await roomServiceClient.deleteRoom(liveKitRoomId).catch((cleanupError: unknown) => {
        console.error('Failed to cleanup LiveKit room after DB error:', cleanupError);
      });

      throw error;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
    const shareableLink = appUrl ? `${appUrl}/room/${room.id}` : `/room/${room.id}`;

    return Response.json({ room, shareableLink }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: 'Invalid input.', details: error.flatten() }, { status: 400 });
    }

    console.error('Failed to create room:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function GET(): Promise<Response> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const hostUser = await ensureHostUser(userId);

    const rooms = await db.room.findMany({
      where: { hostId: hostUser.id },
      orderBy: { createdAt: 'desc' },
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

    return Response.json({ rooms });
  } catch (error) {
    console.error('Failed to list rooms:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
