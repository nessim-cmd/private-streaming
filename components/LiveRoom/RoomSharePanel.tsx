"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { RoomQRCode } from "@/components/QRCode/RoomQRCode";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Check, Copy, Loader2, Mail, QrCode, Share2 } from "lucide-react";

interface RoomSharePanelProps {
  roomId: string;
  roomName: string;
}

export function RoomSharePanel({ roomId, roomName }: RoomSharePanelProps) {
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const shareableLink = useMemo(() => {
    if (typeof window === "undefined") {
      return `/room/${roomId}`;
    }

    return `${window.location.origin}/room/${roomId}`;
  }, [roomId]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareableLink);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1800);
  };

  const shareLink = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: roomName,
        text: `Join my live room: ${roomName}`,
        url: shareableLink,
      });
      setIsShared(true);
      window.setTimeout(() => setIsShared(false), 1800);
      return;
    }

    await copyLink();
  };

  const openMessengerShare = async () => {
    const encoded = encodeURIComponent(shareableLink);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, "_blank", "noopener,noreferrer");
  };

  const shareToInstagram = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: roomName,
        text: `Join my live room on PrivateLive: ${roomName}`,
        url: shareableLink,
      });
      return;
    }

    await copyLink();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  const sendInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    setIsInviting(true);
    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, email }),
      });
      const payload = await response.json();

      if (response.ok) {
        setEmail("");
      } else {
        console.error("Invite email failed:", payload?.error ?? "Unknown error");
      }
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <section className="glass rounded-2xl border border-white/10 p-3 sm:p-5 space-y-4 animate-in">
      <div className="flex items-center gap-2">
        <QrCode className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-white">Share this room</h3>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[auto_1fr] lg:items-start">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <RoomQRCode value={shareableLink} size={112} />
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">QR to join</p>
        </div>

        <div className="space-y-3 min-w-0">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Link</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0 rounded-lg border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300 truncate font-mono">
                {shareableLink}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={copyLink} className="shrink-0 gap-2 w-full sm:w-auto">
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {isCopied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={shareLink} className="gap-2 justify-center">
              <Share2 className="h-4 w-4" />
              {isShared ? "Share Opened" : "Open Share Sheet"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={openMessengerShare} className="gap-2 justify-center">
              Messenger
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={shareToInstagram} className="gap-2 justify-center">
              Instagram
            </Button>
          </div>

          <form onSubmit={sendInvite} className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Invite by email</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="bg-zinc-900/50"
              />
              <Button type="submit" disabled={isInviting || !email.trim()} className="shrink-0 gap-2 w-full sm:w-auto">
                {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {isInviting ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
