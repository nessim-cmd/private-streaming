"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { Shield, Share2, Smartphone, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "../lib/i18n";

const EXPERIENCE_IMAGES = [
  "/images/gamers.png",
  "/images/wedding.png",
  "/images/party.png"
];

export default function Home() {
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % EXPERIENCE_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-12 sm:py-24 px-4 overflow-hidden">
      {/* Dynamic Background Slideshow */}
      <div className="fixed inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${EXPERIENCE_IMAGES[currentImageIndex]})` }}
          />
        </AnimatePresence>
        {/* Gray/Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-zinc-950" />
      </div>

      <div className="hero-glow" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-5xl mx-auto text-center z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-white text-xs sm:text-sm font-bold mb-8 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          {t('hero_badge')}
        </motion.div>

        <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.85] text-white">
          <span className="gradient-text">{t('hero_title')}</span> <br />
          <span className="primary-gradient-text italic drop-shadow-2xl">{t('hero_simplified')}</span>
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-zinc-300 mb-12 max-w-3xl mx-auto leading-relaxed font-bold drop-shadow-lg">
          {t('hero_desc')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-24">
          <Button asChild size="lg" className="h-16 px-12 text-xl font-black rounded-2xl shadow-2xl shadow-primary/40 group btn-hover-effect border border-white/10">
            <Link href="/dashboard" className="flex items-center gap-3">
              {t('start_stream')}
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left relative">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full -z-10" />
          {[
            {
              icon: Shield,
              title: t('feature_private_title'),
              desc: t('feature_private_desc'),
              color: "text-blue-400"
            },
            {
              icon: Share2,
              title: t('feature_sharing_title'),
              desc: t('feature_sharing_desc'),
              color: "text-purple-400"
            },
            {
              icon: Smartphone,
              title: t('feature_pwa_title'),
              desc: t('feature_pwa_desc'),
              color: "text-emerald-400"
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass p-8 rounded-[2.5rem] border-white/10 hover:border-white/20 transition-all group"
            >
              <div className={`h-14 w-14 rounded-2xl bg-zinc-900/50 flex items-center justify-center mb-6 ${feature.color} border border-white/5 shadow-inner group-hover:scale-110 transition-transform`}>
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-black mb-3 text-white italic">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed font-bold text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
}
