"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoomCard } from "@/components/Dashboard/RoomCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Loader2, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Room {
  id: string;
  name: string;
  isActive: boolean;
  [key: string]: any;
}

export default function DashboardPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/rooms")
      .then((res) => res.json())
      .then((data) => {
        setRooms(data.rooms || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.room) {
        router.push(`/room/${data.room.id}`);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Live Rooms</h1>
            <p className="text-muted-foreground">Manage and create your private streaming spaces.</p>
          </div>
        </header>

        <form
          onSubmit={createRoom}
          className="glass rounded-2xl p-6 flex flex-col sm:flex-row gap-4 items-end"
        >
          <div className="flex-1 w-full space-y-2">
            <label htmlFor="room-name" className="text-sm font-medium text-zinc-400">
              New Room Name
            </label>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Awesome Stream"
              required
              className="bg-zinc-900/50"
            />
          </div>
          <Button type="submit" disabled={creating || !name} className="w-full sm:w-auto h-10 px-6 gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Room
          </Button>
        </form>

        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-zinc-300 flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Active & Past Rooms
          </h2>
          
          <div className="grid gap-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading your rooms...</p>
              </div>
            ) : rooms.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 glass rounded-2xl border-dashed border-2"
              >
                <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <Video className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No rooms yet</h3>
                <p className="text-muted-foreground mb-6">Create your first private streaming room above.</p>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {rooms.map((room: any, index: number) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <RoomCard
                      id={room.id}
                      name={room.name}
                      shareableLink={`/room/${room.id}`}
                      isActive={room.isActive ?? true}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
