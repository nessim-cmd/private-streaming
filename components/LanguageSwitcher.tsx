"use client";

import { useTranslation, Language } from "../lib/i18n";
import { Button } from "./ui/Button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { useEffect } from "react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  useEffect(() => {
    const dir = language === 'ar' || language === 'tn' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'tn', label: 'Tunisienne', flag: '🇹🇳' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-white/10 min-w-[140px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`cursor-pointer flex items-center gap-2 py-2 px-3 ${
              language === lang.code ? "bg-primary/20 text-primary" : "text-white/70 hover:text-white"
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="font-medium text-sm">{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
