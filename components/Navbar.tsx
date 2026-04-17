"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "./ui/Button";
import { Video, Loader2 } from "lucide-react";

export function Navbar() {
  const { user, isLoaded } = useUser();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="bg-primary rounded-lg p-1.5 shadow-[0_0_15px_rgba(var(--primary),0.5)]">
            <Video className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">PrivateLive</span>
        </Link>

        <div className="flex items-center gap-4">
          {!isLoaded ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
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
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
