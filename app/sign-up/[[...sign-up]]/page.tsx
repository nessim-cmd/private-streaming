import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export default function Page() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
      <SignUp 
        appearance={{
          baseTheme: dark,
          elements: {
            rootBox: "w-full flex justify-center",
            cardBox: "w-full max-w-md",
            card: "w-full bg-zinc-900/95 border border-white/20 shadow-[0_24px_80px_rgba(0,0,0,0.55)] rounded-2xl",
            headerTitle: "text-white font-bold",
            headerSubtitle: "text-zinc-300",
            socialButtonsBlockButton: "bg-zinc-800/90 border border-white/15 text-zinc-100 hover:bg-zinc-700 transition-colors",
            formFieldInput: "bg-zinc-800/90 border border-white/20 text-zinc-100 placeholder:text-zinc-400",
            formFieldLabel: "text-zinc-200",
            formButtonPrimary: "bg-primary hover:opacity-90 text-white transition-opacity",
            footerActionLink: "text-primary hover:text-primary/80",
            identityPreviewText: "text-zinc-300",
            identityPreviewEditButton: "text-primary",
          }
        }}
      />
    </div>
  );
}
