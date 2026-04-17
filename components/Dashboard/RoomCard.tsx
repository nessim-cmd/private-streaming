import React, { useState } from "react";
import Link from "next/link";
import { RoomQRCode } from "@/components/QRCode/RoomQRCode";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Copy, ExternalLink, Video, Mail, Check, Loader2 } from "lucide-react";

interface RoomCardProps {
  id: string;
  name: string;
  shareableLink: string;
  isActive: boolean;
}

export function RoomCard({ id, name, shareableLink, isActive }: RoomCardProps) {
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isInvited, setIsInvited] = useState(false);
  const fullLink = typeof window !== "undefined" ? window.location.origin + shareableLink : shareableLink;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullLink);
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsInviting(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: id, email }),
      });
      if (res.ok) {
        setIsInvited(true);
        setEmail("");
        setTimeout(() => setIsInvited(false), 3000);
      }
    } catch (error) {
      console.error("Failed to send invite:", error);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 flex flex-col gap-6 animate-in transition-all hover:scale-[1.01]">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{name}</h3>
            <p className="text-sm text-muted-foreground">ID: {id}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
          isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-500"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"}`} />
          {isActive ? "Live Now" : "Was Live"}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex flex-col gap-4 items-center shrink-0">
          <RoomQRCode value={fullLink} size={120} />
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Scan to join</p>
        </div>
        
        <div className="flex-1 flex flex-col gap-6 w-full">
          {/* Share Link */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Share Link</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-zinc-900/50 border border-border rounded-lg px-3 py-2 text-sm text-zinc-300 truncate font-mono">
                {fullLink}
              </div>
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="shrink-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Invite Guests */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Invite via Email</label>
            <form onSubmit={sendInvite} className="flex gap-2">
              <Input 
                type="email" 
                placeholder="friend@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-9 bg-zinc-900/50"
              />
              <Button type="submit" size="sm" disabled={isInviting || !email} className="shrink-0 gap-2">
                {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : isInvited ? <Check className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                {isInvited ? "Sent!" : "Invite"}
              </Button>
            </form>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button asChild className="flex-1 gap-2" variant="primary">
              <Link href={shareableLink}>
                <Video className="h-4 w-4" />
                Open Room
              </Link>
            </Button>
            <Button variant="outline" asChild className="shrink-0">
              <Link href={shareableLink} target="_blank">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
