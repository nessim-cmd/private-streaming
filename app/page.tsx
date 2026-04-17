"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Shield, Share2, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Next Generation Streaming
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
          Private Streaming <br />
          <span className="text-primary">Simplified.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Create secure, private live streaming rooms in seconds. 
          Invite guests with a single link, QR code, or email. No complicated setup.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Button asChild size="lg" className="h-14 px-8 text-lg font-semibold">
            <Link href="/dashboard">Start Your Stream</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold">
            <Link href="/sign-in">Join a Room</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-10">
          {[
            {
              icon: Shield,
              title: "Fully Private",
              desc: "Your stream, your rules. Only invited guests can join your secure room."
            },
            {
              icon: Share2,
              title: "Easy Sharing",
              desc: "Share via unique links, dynamic QR codes, or direct email invitations."
            },
            {
              icon: Smartphone,
              title: "PWA Ready",
              desc: "Install on your home screen and stream from anywhere with our mobile-first design."
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="glass p-6 rounded-2xl"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
