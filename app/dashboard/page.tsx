"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoomCard } from "../../components/Dashboard/RoomCard";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Plus, Loader2, Video, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "../../lib/i18n";

interface Room {
  id: string;
  name: string;
  isActive: boolean;
}

export default function DashboardPage() {
  const { t } = useTranslation();
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
    <div className="container mx-auto w-full px-4 sm:px-8 py-8 sm:py-16 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-12"
      >
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {t('dashboard_title')}
            </h1>
            <p className="text-lg text-zinc-400 max-w-xl font-medium">
              {t('dashboard_desc')}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            {rooms.length} {t('active_past_rooms')}
          </div>
        </header>

        <form
          onSubmit={createRoom}
          className="glass rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-end relative overflow-hidden group border-white/10 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex-1 w-full space-y-3 relative">
            <label htmlFor="room-name" className="text-sm font-bold text-zinc-400 uppercase tracking-widest ml-1">
              {t('new_room_label')}
            </label>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('room_placeholder')}
              required
              className="bg-zinc-900/50 h-14 rounded-2xl border-white/5 focus:border-primary/50 focus:ring-primary/20 text-lg transition-all"
            />
          </div>
          <Button
            type="submit"
            disabled={creating || !name}
            className="w-full md:w-auto h-14 px-8 rounded-2xl gap-3 text-lg font-bold shadow-xl shadow-primary/20 btn-hover-effect relative cursor-pointer"
          >
            {creating ? <Loader2 className="h-5 w-5 animate-spin cursor-pointer" /> : <Plus className="h-5 w-5 cursor-pointer" />}
            {t('create_room')}
          </Button>
        </form>

        <div className="space-y-8">
          <h2 className="text-xl font-bold text-zinc-200 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <Video className="h-4 w-4 text-primary" />
            </div>
            {t('active_past_rooms')}
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4 col-span-full">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                </div>
                <p className="text-zinc-400 font-medium">{t('loading_rooms')}</p>
              </div>
            ) : rooms.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24 glass rounded-[2.5rem] border-dashed border-2 border-white/10 col-span-full"
              >
                <div className="bg-primary/10 h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary shadow-inner">
                  <Video className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">{t('no_rooms_title')}</h3>
                <p className="text-zinc-400 mb-8 max-w-sm mx-auto font-medium">{t('no_rooms_desc')}</p>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {rooms.map((room, index: number) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
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
      </motion.div>
    </div>
  );
}

