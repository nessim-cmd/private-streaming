"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/Button";
import { StreamEnded } from "@/components/LiveRoom/StreamEnded";
import { VideoConference } from "@/components/LiveRoom/VideoConference";
import { ChevronLeft, Loader2, Users, Video } from "lucide-react";
import { motion } from "framer-motion";

interface Room {
  id: string;
  name: string;
  isActive: boolean;
  [key: string]: any;
}

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [room, setRoom] = useState<Room | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/rooms/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setRoom(data.room);
        setIsHost(data.isHost);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const joinRoom = async () => {
    setJoining(true);
    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: id, isHost }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
      }
    } catch (error) {
      console.error("Failed to join room:", error);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Entering the room...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <Users className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold">Room Not Found</h1>
        <p className="text-muted-foreground max-w-md text-center">
          The room you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (room.isActive === false) {
    return <StreamEnded />;
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border bg-background/50 backdrop-blur-sm px-4 sm:px-8 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/dashboard")}
              className="hidden md:flex gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Exit
            </Button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {room.name}
              </h1>
              <p className="text-xs text-muted-foreground">Hosted by you</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium border border-border">
              <Users className="h-3 w-3" />
              <span>0 Participants</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 sm:p-8">
        <div className="container mx-auto flex-1 flex flex-col max-w-6xl">
          {!token ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="glass p-12 rounded-3xl max-w-md w-full text-center space-y-8">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Video className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Ready to join?</h2>
                  <p className="text-muted-foreground">
                    Connect your camera and microphone to start streaming.
                  </p>
                </div>
                <Button 
                  onClick={joinRoom} 
                  disabled={joining} 
                  className="w-full h-12 text-lg font-semibold"
                >
                  {joining ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Join Stream"
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <VideoConference 
              token={token} 
              isHost={isHost} 
            />
          )}
        </div>
      </main>
    </div>
  );
}
