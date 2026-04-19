import React, { useState } from "react";
import Link from "next/link";
import { RoomQRCode } from "../QRCode/RoomQRCode";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Copy, Share2, Video, Mail, Check, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface RoomCardProps {
  id: string;
  name: string;
  shareableLink: string;
  isActive: boolean;
}

export function RoomCard({ id, name, shareableLink, isActive }: RoomCardProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isInvited, setIsInvited] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fullLink = typeof window !== "undefined" ? window.location.origin + shareableLink : shareableLink;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsInviting(true);
    setInviteError(null);
    setInviteInfo(null);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: id, email }),
      });
      const payload = await res.json();

      if (res.ok) {
        setIsInvited(true);
        setInviteInfo(t('copy_link')); // Reusing or just "Sent"
        setEmail("");
        setTimeout(() => setIsInvited(false), 3000);
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
    <div className="glass-card rounded-[2rem] p-6 sm:p-8 flex flex-col gap-6 group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="h-24 w-24 text-primary" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 z-10">
        <div className="flex gap-4 min-w-0">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
            <Video className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-white truncate leading-tight">{name}</h3>
            <p className="text-sm text-zinc-500 truncate font-mono">ID: {id}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 w-fit border ${isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
          }`}>
          <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" : "bg-zinc-500"}`} />
          {isActive ? "Live" : "Inactive"}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[120px_1fr] items-start z-10">
        <div className="flex flex-col gap-3 items-center shrink-0">
          <div className="p-3 bg-white rounded-2xl shadow-xl group-hover:rotate-3 transition-transform">
            <RoomQRCode value={fullLink} size={100} />
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{t('scan_qr')}</p>
        </div>

        <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
          {/* Share Link */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">{t('copy_link')}</label>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0 bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-300 truncate font-mono">
                {fullLink}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="shrink-0 h-11 w-11 rounded-xl border-white/10 glass hover:text-primary transition-colors"
              >
                {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Invite Guests */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">{t('send_email')}</label>
            <form onSubmit={sendInvite} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-11 bg-zinc-950/50 rounded-xl border-white/5 focus:border-primary/50"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isInviting || !email}
                  className="shrink-0 h-11 w-11 rounded-xl shadow-lg shadow-primary/10"
                >
                  {isInviting ? <Loader2 className="h-5 w-5 animate-spin" /> : isInvited ? <Check className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                </Button>
              </div>
              {inviteInfo && <p className="text-xs text-emerald-400 font-medium ml-1">✓ {inviteInfo}</p>}
              {inviteError && <p className="text-xs text-red-400 font-medium ml-1">✕ {inviteError}</p>}
            </form>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button asChild className="w-full sm:flex-1 h-12 gap-3 rounded-xl font-bold shadow-xl shadow-primary/20 btn-hover-effect">
              <Link href={shareableLink} className="flex items-center justify-center gap-2 px-4">
                <Video className="h-5 w-5 shrink-0" />
                <span className="whitespace-nowrap">{t('start_stream')}</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-12 w-full sm:w-12 rounded-xl border-white/10 glass hover:text-primary transition-colors shrink-0">
              <Link href={shareableLink} target="_blank" className="flex items-center justify-center w-full h-full">
                <Share2 className="h-5 w-5 text-primary" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

