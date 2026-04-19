import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Slot } from "@radix-ui/react-slot";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "icon";
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
}

export function Button({ 
  children, 
  className = "", 
  variant = "primary", 
  size = "md",
  asChild = false,
  ...props 
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  const variants = {
    primary: "bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-white/5",
    outline: "border border-white/10 bg-transparent hover:bg-white/5 hover:text-white backdrop-blur-sm",
    ghost: "hover:bg-white/5 hover:text-white",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20",
    icon: "bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white",
  };

  const sizes = {
    sm: "h-9 px-4 text-xs rounded-xl",
    md: "h-11 px-6 py-2 rounded-xl",
    lg: "h-14 px-8 text-lg rounded-2xl",
    icon: "h-10 w-10 rounded-xl",
  };

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96] select-none",
        variants[variant],
        sizes[size === 'icon' ? 'icon' : size],
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

