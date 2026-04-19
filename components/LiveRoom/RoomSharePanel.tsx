"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { RoomQRCode } from "../QRCode/RoomQRCode";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Check, Copy, Loader2, Mail, QrCode, Share2, MessageCircle, Camera } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface RoomSharePanelProps {
  roomId: string;
  roomName: string;
}

export function RoomSharePanel({ roomId, roomName }: RoomSharePanelProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

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
    setInviteFeedback(null);
    setInviteError(null);
    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, email }),
      });
      const payload = await response.json();

      if (response.ok) {
        setInviteFeedback(t('copy_link')); // Reusing or custom message
        setEmail("");
      } else {
        const errorMessage = typeof payload?.error === "string" ? payload.error : "Invite failed.";
        setInviteError(errorMessage);
      }
    } catch (error) {
      setInviteError("Network error while sending invite.");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <section className="glass-card rounded-[2rem] border border-white/10 p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Share2 className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-xl font-black text-white italic">{t('share_room')}</h3>
      </div>

      <div className="grid gap-8 lg:grid-cols-[140px_1fr] lg:items-start">
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="p-3 bg-white rounded-2xl shadow-2xl">
            <RoomQRCode value={shareableLink} size={112} />
          </div>
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">{t('scan_qr')}</p>
        </div>

        <div className="space-y-6 min-w-0">
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">{t('copy_link')}</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0 rounded-xl border border-white/5 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-300 truncate font-mono">
                {shareableLink}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={copyLink} className="shrink-0 h-11 px-5 rounded-xl gap-2 font-bold glass">
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {isCopied ? "Done" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button type="button" variant="outline" size="sm" onClick={shareLink} className="h-11 rounded-xl gap-2 font-bold glass">
              <QrCode className="h-4 w-4" />
              {isShared ? "Opened" : "Share"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={openMessengerShare} className="h-11 rounded-xl gap-2 font-bold glass">
              <MessageCircle className="h-4 w-4" />
              Messenger
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={shareToInstagram} className="h-11 rounded-xl gap-2 font-bold glass">
              <Camera className="h-4 w-4" />
              Instagram
            </Button>
          </div>

          <form onSubmit={sendInvite} className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">{t('send_email')}</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 bg-zinc-950/50 rounded-xl border-white/5"
              />
              <Button type="submit" disabled={isInviting || !email.trim()} className="shrink-0 h-11 px-6 rounded-xl gap-2 font-bold shadow-lg shadow-primary/10">
                {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {isInviting ? t('loading') : t('create_room')}
              </Button>
            </div>

            {inviteFeedback && <p className="text-xs text-emerald-400 font-bold ml-1">✓ {inviteFeedback}</p>}
            {inviteError && <p className="text-xs text-red-400 font-bold ml-1">✕ {inviteError}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}

