"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useChat, useParticipants } from "@livekit/components-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SendHorizontal } from "lucide-react";

interface PersistedMessage {
  id: string;
  message: string;
  senderIdentity: string;
  senderName: string;
  createdAt: string;
}

interface LiveOverlayFeedProps {
  roomId: string;
}

function getParticipantLabel(name?: string | null, identity?: string): string {
  if (name && name.trim().length > 0) {
    return name;
  }

  if (!identity) {
    return "Guest";
  }

  if (identity.startsWith("guest-")) {
    return "Guest";
  }

  return identity;
}

export function LiveOverlayFeed({ roomId }: LiveOverlayFeedProps) {
  const { chatMessages, send, isSending } = useChat();
  const participants = useParticipants();
  const [message, setMessage] = useState("");
  const [historyMessages, setHistoryMessages] = useState<PersistedMessage[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/messages`);
        const data = await response.json();
        if (isMounted && Array.isArray(data.messages)) {
          setHistoryMessages(data.messages as PersistedMessage[]);
        }
      } catch (error) {
        console.error("Failed to load persisted room messages:", error);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  const liveMessages = useMemo(() => {
    return chatMessages.map((chatMessage) => ({
      id: chatMessage.id ?? `${chatMessage.timestamp}-${chatMessage.from?.identity ?? "unknown"}`,
      message: chatMessage.message,
      senderIdentity: chatMessage.from?.identity ?? "unknown",
      senderName: chatMessage.from?.name ?? chatMessage.from?.identity ?? "Guest",
      createdAt: new Date(chatMessage.timestamp).toISOString(),
    }));
  }, [chatMessages]);

  const mergedMessages = useMemo(() => {
    const map = new Map<string, PersistedMessage>();

    for (const item of historyMessages) {
      map.set(item.id, item);
    }

    for (const item of liveMessages) {
      map.set(item.id, item);
    }

    return Array.from(map.values()).sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  }, [historyMessages, liveMessages]);

  const latestMessageByIdentity = useMemo(() => {
    const latest = new Map<string, PersistedMessage>();

    for (const item of mergedMessages) {
      latest.set(item.senderIdentity, item);
    }

    return latest;
  }, [mergedMessages]);

  const participantRows = useMemo(() => {
    return participants.map((participant) => {
      const label = getParticipantLabel(participant.name, participant.identity);
      const latestMessage = latestMessageByIdentity.get(participant.identity);
      return {
        identity: participant.identity,
        label,
        latestMessage: latestMessage?.message ?? "",
      };
    });
  }, [participants, latestMessageByIdentity]);

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    await send(trimmed);

    void fetch(`/api/rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed }),
    }).catch((error) => {
      console.error("Failed to persist chat message:", error);
    });

    setMessage("");
  };

  return (
    <div className="pointer-events-none absolute inset-0 p-2 sm:p-4 flex flex-col justify-between gap-2">
      <div className="self-stretch sm:self-end w-full sm:max-w-sm pointer-events-auto">
        <div className="rounded-2xl border border-white/20 bg-black/35 backdrop-blur-md p-3 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-300">Live Audience</p>
          <div className="max-h-36 sm:max-h-56 overflow-y-auto space-y-2 pr-1">
            {participantRows.length === 0 ? (
              <p className="text-xs text-zinc-400">No participants yet.</p>
            ) : (
              participantRows.map((row) => {
                const avatarLetter = row.label.charAt(0).toUpperCase();
                return (
                  <div
                    key={row.identity}
                    className="flex items-start gap-2 rounded-xl bg-black/30 border border-white/10 px-2.5 py-2"
                  >
                    <div className="h-7 w-7 rounded-full bg-primary/30 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                      {avatarLetter}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">{row.label}</p>
                      <p className="text-xs text-zinc-300 truncate">
                        {row.latestMessage.length > 0 ? row.latestMessage : "No comment yet"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <form onSubmit={submitMessage} className="pointer-events-auto w-full sm:max-w-xl">
        <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-black/35 backdrop-blur-md p-2">
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write a comment..."
            maxLength={500}
            disabled={isSending}
            className="h-10 bg-zinc-900/70 border-zinc-700 text-sm"
            onKeyDown={(event) => event.stopPropagation()}
            onKeyUp={(event) => event.stopPropagation()}
          />
          <Button
            type="submit"
            disabled={isSending || message.trim().length === 0}
            className="h-10 px-3"
            aria-label="Send message"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
