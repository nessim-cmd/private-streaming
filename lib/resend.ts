import { Resend } from 'resend';

export async function sendInviteEmail({
  to,
  roomName,
  roomLink,
  hostName,
}: {
  to: string;
  roomName: string;
  roomLink: string;
  hostName: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: 'PrivateLive <onboarding@resend.dev>', // Should be a verified domain in production
    to,
    subject: `${hostName} invited you to a private live room: ${roomName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 8px;">
        <h2 style="color: #6366f1;">You're Invited!</h2>
        <p><strong>${hostName}</strong> is inviting you to join their private live streaming room <strong>${roomName}</strong> on PrivateLive.</p>
        <div style="margin: 30px 0;">
          <a href="${roomLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Join the Stream
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${roomLink}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">PrivateLive — Private Live Streaming Rooms App</p>
      </div>
    `,
  });
}
