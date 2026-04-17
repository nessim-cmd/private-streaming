"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { VideoOff } from "lucide-react";
import { motion } from "framer-motion";

export function StreamEnded() {
  const router = useRouter();

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-12 rounded-3xl max-w-md w-full text-center space-y-8"
      >
        <div className="h-20 w-20 bg-zinc-500/10 rounded-full flex items-center justify-center mx-auto text-zinc-500">
          <VideoOff className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Stream Ended</h2>
          <p className="text-muted-foreground">
            The host has finished this live session. Thank you for watching!
          </p>
        </div>
        <Button 
          onClick={() => router.push("/dashboard")} 
          className="w-full h-12 text-lg font-semibold"
        >
          Back to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
