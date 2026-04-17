"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useChat, useLocalParticipant, useParticipants } from "@livekit/components-react";
import { MessageCircle, SendHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ChatMessageItem {
  id: string;
  message: string;
  senderIdentity: string;
  senderName: string;
  createdAt: string;
}

interface LiveChatPanelProps {
  roomId: string;
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function getDisplayName(identity?: string): string {
  if (!identity) {
    return "Guest";
  }

  if (identity.startsWith("guest-")) {
    return "Guest";
  }

  return identity;
}

export function LiveChatPanel({ roomId }: LiveChatPanelProps) {
  const { chatMessages, send, isSending } = useChat();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  const [message, setMessage] = useState("");
  const [historyMessages, setHistoryMessages] = useState<ChatMessageItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const onlineCount = useMemo(() => participants.length, [participants.length]);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await fetch(`/api/rooms/${roomId}/messages`);
        const data = await response.json();
        if (isMounted && Array.isArray(data.messages)) {
          setHistoryMessages(data.messages as ChatMessageItem[]);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        if (isMounted) {
          setLoadingHistory(false);
        }
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages, historyMessages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

  const liveMessages = useMemo(() => {
    return chatMessages.map((chatMessage) => ({
      id: chatMessage.id ?? `${chatMessage.timestamp}-${chatMessage.from?.identity ?? "unknown"}`,
      message: chatMessage.message,
      senderIdentity: chatMessage.from?.identity ?? "unknown",
      senderName: chatMessage.from?.name ?? chatMessage.from?.identity ?? "Guest",
      createdAt: new Date(chatMessage.timestamp).toISOString(),
    }));
  }, [chatMessages]);

  const allMessages = useMemo(() => {
    const merged = new Map<string, ChatMessageItem>();

    for (const item of historyMessages) {
      merged.set(item.id, item);
    }

    for (const item of liveMessages) {
      merged.set(item.id, item);
    }

    return Array.from(merged.values()).sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  }, [historyMessages, liveMessages]);

  return (
    <aside className="h-[44vh] lg:h-full lg:w-[360px] xl:w-[400px] glass rounded-2xl border border-white/10 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 bg-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-white">Live Chat</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-300">
            <Users className="h-3.5 w-3.5" />
            <span>{onlineCount}</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-zinc-400">Chat with everyone watching this stream.</p>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-black/15">
        {loadingHistory ? (
          <div className="h-full flex items-center justify-center text-center px-4">
            <p className="text-xs text-zinc-400">Loading chat history...</p>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-4">
            <p className="text-xs text-zinc-400">
              No messages yet. Say hi and start the conversation.
            </p>
          </div>
        ) : (
          allMessages.map((chatMessage, index) => {
            const isMine = chatMessage.senderIdentity === localParticipant.identity;
            const senderName = isMine ? "You" : getDisplayName(chatMessage.senderIdentity);
            const initials = senderName.charAt(0).toUpperCase();

            return (
              <div
                key={chatMessage.id ?? `${chatMessage.createdAt}-${index}`}
                className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}
              >
                {!isMine && (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-zinc-700/70 text-[10px] font-semibold text-white flex items-center justify-center mt-1">
                    {initials}
                  </div>
                )}

                <div className={`max-w-[82%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span className="font-medium text-zinc-300">{senderName}</span>
                    <span>{formatTime(new Date(chatMessage.createdAt).getTime())}</span>
                  </div>
                  <div
                    className={`mt-1 rounded-2xl px-3 py-2 text-sm leading-relaxed break-words ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-tr-md"
                        : "bg-zinc-800/90 text-zinc-100 rounded-tl-md"
                    }`}
                  >
                    {chatMessage.message}
                  </div>
                </div>

                {isMine && (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-primary/20 text-[10px] font-semibold text-primary-foreground flex items-center justify-center mt-1 border border-primary/40">
                    {initials}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-black/25">
        <div className="flex items-center gap-2">
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write a comment..."
            maxLength={400}
            disabled={isSending}
            className="h-10 bg-zinc-900/80 border-zinc-700 focus-visible:ring-primary"
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
    </aside>
  );
}