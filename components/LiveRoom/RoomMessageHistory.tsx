"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";

interface RoomMessage {
  id: string;
  message: string;
  senderIdentity: string;
  senderName: string;
  createdAt: string;
}

interface RoomMessageHistoryProps {
  roomId: string;
}

function formatTimestamp(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

export function RoomMessageHistory({ roomId }: RoomMessageHistoryProps) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/rooms/${roomId}/messages`);
        const data = await response.json();
        if (isMounted && Array.isArray(data.messages)) {
          setMessages(data.messages as RoomMessage[]);
        }
      } catch (error) {
        console.error("Failed to load room chat history:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  }, [messages]);

  return (
    <section className="glass rounded-2xl border border-white/10 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-white">Room Chat History</h3>
      </div>

      <div className="max-h-[360px] overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <p className="text-sm text-zinc-400">Loading messages...</p>
        ) : sortedMessages.length === 0 ? (
          <p className="text-sm text-zinc-400">No chat messages in this room yet.</p>
        ) : (
          sortedMessages.map((message) => (
            <article key={message.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-200 truncate">{message.senderName}</p>
                <p className="text-[11px] text-zinc-500 shrink-0">{formatTimestamp(message.createdAt)}</p>
              </div>
              <p className="text-sm text-zinc-300 mt-1 break-words">{message.message}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
