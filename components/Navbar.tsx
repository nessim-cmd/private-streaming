"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "./ui/Button";
import { Video, Loader2 } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "../lib/i18n";

export function Navbar() {
  const { user, isLoaded } = useUser();
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl safe-pt">
      <div className="container mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group">
          <div className="bg-primary rounded-xl p-2 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
            <Video className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white primary-gradient-text">PrivateLive</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <LanguageSwitcher />
          
          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          {!isLoaded ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
              >
                {t('dashboard_title')}
              </Link>
              <Link 
                href="/recordings" 
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
              >
                Recordings
              </Link>
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-9 w-9 rounded-xl border-2 border-white/10 overflow-hidden shadow-xl"
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex text-zinc-400 hover:text-white">
                <Link href="/sign-in">{t('login')}</Link>
              </Button>
              <Button asChild size="sm" className="rounded-xl px-5 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                <Link href="/sign-up">{t('signup')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

