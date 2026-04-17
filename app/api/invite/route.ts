export const dynamic = 'force-dynamic';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ZodError, z } from 'zod';
import { db } from '@/lib/db';
import { sendInviteEmail } from '@/lib/resend';

const inviteSchema = z.object({
  roomId: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const hostName = clerkUser?.firstName ?? clerkUser?.username ?? 'A friend';

    const body = inviteSchema.parse(await req.json());

    const room = await db.room.findUnique({
      where: { id: body.roomId },
      include: { host: true },
    });

    if (!room) {
      return Response.json({ error: 'Room not found.' }, { status: 404 });
    }

    if (room.host.clerkId !== userId) {
      return Response.json({ error: 'Only the host can send invites.' }, { status: 403 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const roomLink = `${appUrl}/room/${room.id}`;

    const emailResult = await sendInviteEmail({
      to: body.email,
      roomName: room.name,
      roomLink,
      hostName,
    });

    await db.invitation.create({
      data: {
        roomId: body.roomId,
        email: body.email,
        status: 'pending',
      },
    });

    return Response.json({ success: true, messageId: emailResult.data?.id ?? null });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: 'Invalid input.', details: error.flatten() }, { status: 400 });
    }

    if (error instanceof Error) {
      console.error('Failed to send invite:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.error('Failed to send invite:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
