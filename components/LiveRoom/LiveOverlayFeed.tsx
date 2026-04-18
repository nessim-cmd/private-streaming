"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useChat } from "@livekit/components-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eye, EyeOff, Expand, Minimize2, SendHorizontal } from "lucide-react";

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

type ChatDisplayMode = "hidden" | "compact" | "full";

export function LiveOverlayFeed({ roomId }: LiveOverlayFeedProps) {
  const { chatMessages, send, isSending } = useChat();
  const [message, setMessage] = useState("");
  const [historyMessages, setHistoryMessages] = useState<PersistedMessage[]>([]);
  const [displayMode, setDisplayMode] = useState<ChatDisplayMode>("compact");

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

  const compactMessages = useMemo(() => mergedMessages.slice(-2), [mergedMessages]);
  const fullMessages = useMemo(() => mergedMessages.slice(-50), [mergedMessages]);

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

  const toggleVisibility = () => {
    setDisplayMode((previous) => (previous === "hidden" ? "compact" : "hidden"));
  };

  const toggleCompactFull = () => {
    setDisplayMode((previous) => (previous === "full" ? "compact" : "full"));
  };

  const formatSender = (senderName: string, senderIdentity: string) => {
    if (senderName.trim().length > 0) {
      return senderName;
    }

    if (senderIdentity.startsWith("guest-")) {
      return "Guest";
    }

    return senderIdentity;
  };

  return (
    <div className="pointer-events-none absolute inset-0 p-2 sm:p-4 flex flex-col justify-between gap-2">
      <div className="self-end pointer-events-auto flex items-center gap-2">
        <Button
          type="button"
          onClick={toggleVisibility}
          className="h-8 px-3 bg-black/60 border border-white/20 hover:bg-black/75"
          aria-label={displayMode === "hidden" ? "Show chat" : "Hide chat"}
        >
          {displayMode === "hidden" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>

        {displayMode !== "hidden" && (
          <Button
            type="button"
            onClick={toggleCompactFull}
            className="h-8 px-3 bg-black/60 border border-white/20 hover:bg-black/75"
            aria-label={displayMode === "full" ? "Show compact chat" : "Show full chat"}
          >
            {displayMode === "full" ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {displayMode === "compact" && (
        <div className="pointer-events-auto w-full overflow-x-auto">
          <div className="inline-flex min-w-full sm:min-w-0 gap-2 pb-1">
            {compactMessages.length === 0 ? (
              <div className="rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-xs text-zinc-300">
                No chat yet.
              </div>
            ) : (
              compactMessages.map((item) => (
                <div
                  key={item.id}
                  className="max-w-[80vw] sm:max-w-sm rounded-xl border border-white/15 bg-black/45 px-3 py-2 backdrop-blur-sm"
                >
                  <p className="text-[11px] text-zinc-300 font-medium truncate">
                    {formatSender(item.senderName, item.senderIdentity)}
                  </p>
                  <p className="text-xs text-zinc-100 break-words line-clamp-2">{item.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {displayMode === "full" && (
        <div className="pointer-events-auto w-full sm:max-w-xl space-y-2">
          <div className="rounded-2xl border border-white/20 bg-black/35 backdrop-blur-md p-3 space-y-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-300">Live Chat</p>
            <div className="max-h-44 sm:max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {fullMessages.length === 0 ? (
                <p className="text-xs text-zinc-400">No chat yet.</p>
              ) : (
                fullMessages.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-black/30 px-2.5 py-2">
                    <p className="text-[11px] text-zinc-300 font-medium truncate">
                      {formatSender(item.senderName, item.senderIdentity)}
                    </p>
                    <p className="text-xs text-zinc-100 break-words">{item.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={submitMessage}>
            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-black/35 backdrop-blur-md p-2">
              <Input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write a comment..."
                maxLength={500}
                disabled={isSending}
                className="h-10 bg-zinc-900/70 border-zinc-700 text-sm min-w-0"
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
      )}
    </div>
  );
}
