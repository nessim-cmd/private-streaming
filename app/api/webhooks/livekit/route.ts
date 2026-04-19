import { WebhookReceiver } from "livekit-server-sdk";
import { db } from "@/lib/db";

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("Authorization");

    if (!signature) {
      // In development, you might want to skip signature verification
      // but for production, this is critical.
      console.warn("No signature found in LiveKit webhook request");
    }

    const event = await receiver.receive(body, signature || "");

    console.log("LiveKit Webhook Event:", event.event);

    if (event.event === "egress_ended" || event.event === "egress_updated") {
      const egressInfo = event.egressInfo;
      if (egressInfo) {
        const url = egressInfo.fileResults?.[0]?.location;
        const status = egressInfo.status === 4 ? "completed" : egressInfo.status === 5 ? "failed" : "processing";

        await db.recording.update({
          where: { egressId: egressInfo.egressId },
          data: {
            status: status,
            url: url || undefined,
          },
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
