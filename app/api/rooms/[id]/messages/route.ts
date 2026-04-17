import { auth, currentUser } from '@clerk/nextjs/server';
import { ZodError, z } from 'zod';

import { db } from '@/lib/db';

const roomParamsSchema = z.object({
  id: z.string().min(1),
});

const messageSchema = z.object({
  message: z.string().trim().min(1).max(500),
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

function resolveDisplayName(user: Awaited<ReturnType<typeof currentUser>>, email: string): string {
  return user?.fullName ?? user?.firstName ?? user?.username ?? email.split('@')[0] ?? 'Guest';
}

async function assertChatAccess(roomId: string, clerkId: string): Promise<{ isHost: boolean; userId: string | null; email: string | null }> {
  const room = await db.room.findUnique({
    where: { id: roomId },
    include: {
      host: {
        select: { clerkId: true },
      },
    },
  });

  if (!room) {
    throw new Response(JSON.stringify({ error: 'Room not found.' }), { status: 404 });
  }

  if (room.host.clerkId === clerkId) {
    const dbUser = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    return { isHost: true, userId: dbUser?.id ?? null, email: null };
  }

  const clerkUser = await currentUser();
  const email = getPrimaryEmail(clerkUser);

  if (!email) {
    throw new Response(JSON.stringify({ error: 'No primary email found for this account.' }), { status: 400 });
  }

  const approvedInvitation = await db.invitation.findFirst({
    where: {
      roomId,
      email,
      status: 'approved',
    },
    select: { id: true },
  });

  if (!approvedInvitation) {
    throw new Response(JSON.stringify({ error: 'Host approval is required before chatting.' }), { status: 403 });
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  return { isHost: false, userId: dbUser?.id ?? null, email };
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
    await assertChatAccess(id, userId);

    const messages = await db.roomMessage.findMany({
      where: { roomId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        message: true,
        senderIdentity: true,
        senderName: true,
        createdAt: true,
      },
    });

    return Response.json({ messages });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    if (error instanceof ZodError) {
      return Response.json({ error: 'Invalid room ID.', details: error.flatten() }, { status: 400 });
    }

    console.error('Failed to load room messages:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return Response.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { id } = roomParamsSchema.parse(await params);
    const { isHost, userId, email } = await assertChatAccess(id, clerkId);
    const body = messageSchema.parse(await req.json());
    const clerkUser = await currentUser();

    const senderName = isHost
      ? resolveDisplayName(clerkUser, clerkUser?.primaryEmailAddress?.emailAddress ?? 'host')
      : resolveDisplayName(clerkUser, email ?? 'guest');

    const identity = clerkUser?.id ?? clerkId;

    const message = await db.roomMessage.create({
      data: {
        roomId: id,
        userId,
        senderIdentity: identity,
        senderName,
        message: body.message,
      },
      select: {
        id: true,
        message: true,
        senderIdentity: true,
        senderName: true,
        createdAt: true,
      },
    });

    return Response.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    if (error instanceof ZodError) {
      return Response.json({ error: 'Invalid input.', details: error.flatten() }, { status: 400 });
    }

    console.error('Failed to save room message:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
