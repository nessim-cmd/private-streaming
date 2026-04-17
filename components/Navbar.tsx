"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "./ui/Button";
import { Video, Loader2 } from "lucide-react";

export function Navbar() {
  const { user, isLoaded } = useUser();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md safe-pt">
      <div className="container mx-auto px-3 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80 min-w-0">
          <div className="bg-primary rounded-lg p-1.5 shadow-[0_0_15px_rgba(var(--primary),0.5)]">
            <Video className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
          </div>
          <span className="text-base sm:text-xl font-bold tracking-tight text-white truncate">PrivateLive</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {!isLoaded ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : user ? (
            <>
              <Link href="/dashboard" className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-white transition-colors px-2 py-1 rounded-md border border-white/5 hover:border-white/20">
                Dashboard
              </Link>
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-8 w-8 rounded-lg border border-border"
                  }
                }}
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm">
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
