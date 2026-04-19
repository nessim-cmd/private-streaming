"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, Video, Calendar, Play, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import Link from "next/link";

interface Recording {
  id: string;
  roomId: string;
  url: string | null;
  status: string;
  createdAt: string;
  room: {
    name: string;
  };
}

export default function RecordingsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchRecordings = async () => {
      try {
        const res = await fetch("/api/recordings");
        const data = await res.json();
        setRecordings(data.recordings || []);
      } catch (error) {
        console.error("Failed to fetch recordings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-4 sm:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 italic">Saved Streams</h1>
          <p className="text-zinc-400 font-medium text-lg">
            Review and watch your previous live recordings.
          </p>
        </div>
      </div>

      {recordings.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[3rem] p-16 text-center border border-white/10"
        >
          <div className="h-24 w-24 bg-zinc-900/50 rounded-[2rem] flex items-center justify-center mx-auto text-zinc-500 mb-8 border border-white/5">
            <Video className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">No recordings found</h2>
          <p className="text-zinc-400 max-w-md mx-auto mb-8 font-medium">
            You haven&apos;t recorded any streams yet. Start a room and click &quot;Start Save Live&quot; to see them here.
          </p>
          <Button asChild className="h-12 px-8 rounded-xl font-bold">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recordings.map((recording, index) => (
            <motion.div
              key={recording.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-3xl overflow-hidden border border-white/10 group flex flex-col h-full"
            >
              <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <div className="h-14 w-14 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                    <Play className="h-6 w-6 ml-1" />
                  </div>
                </div>
                {recording.status === "active" && (
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full animate-pulse">
                    <span className="h-1.5 w-1.5 bg-white rounded-full" />
                    Recording
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                    {recording.room.name}
                  </span>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(recording.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <h3 className="text-xl font-black text-white mb-4 line-clamp-1 italic">
                  Live Recording {index + 1}
                </h3>

                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold">
                    <Clock className="h-3.5 w-3.5" />
                    {recording.status.toUpperCase()}
                  </div>
                  {recording.url ? (
                    <Button asChild size="sm" variant="ghost" className="text-primary hover:text-white hover:bg-primary rounded-lg font-bold">
                      <a href={recording.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        Watch <ChevronRight className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-zinc-600 text-xs font-bold italic">Processing...</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
