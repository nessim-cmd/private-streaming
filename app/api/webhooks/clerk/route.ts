import { verifyWebhook } from '@clerk/nextjs/webhooks';
export const dynamic = 'force-dynamic';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';

const clerkUserPayloadSchema = z.object({
  id: z.string().min(1),
  primary_email_address_id: z.string().nullable(),
  email_addresses: z.array(
    z.object({
      id: z.string().min(1),
      email_address: z.string().email(),
    })
  ),
});

type ClerkUserPayload = z.infer<typeof clerkUserPayloadSchema>;

function resolvePrimaryEmail(payload: ClerkUserPayload): string | null {
  if (!payload.primary_email_address_id) {
    return null;
  }

  const primaryAddress = payload.email_addresses.find(
    (emailAddress) => emailAddress.id === payload.primary_email_address_id
  );

  return primaryAddress?.email_address ?? null;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const event = await verifyWebhook(req);

    if (event.type === 'user.created' || event.type === 'user.updated') {
      const userPayload = clerkUserPayloadSchema.parse(event.data);
      const primaryEmail = resolvePrimaryEmail(userPayload);

      if (!primaryEmail) {
        return Response.json(
          { error: 'Primary email not found in Clerk payload.' },
          { status: 400 }
        );
      }

      await db.user.upsert({
        where: { clerkId: userPayload.id },
        update: { email: primaryEmail },
        create: {
          clerkId: userPayload.id,
          email: primaryEmail,
        },
      });
    }

    if (event.type === 'user.deleted' && event.data.id) {
      await db.user.deleteMany({
        where: { clerkId: event.data.id },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to process Clerk webhook:', error);
    return Response.json({ error: 'Webhook processing failed.' }, { status: 400 });
  }
}
