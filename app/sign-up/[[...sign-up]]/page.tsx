import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export default function Page() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <SignUp 
        appearance={{
          baseTheme: dark,
          elements: {
            card: "glass border-border shadow-2xl",
            headerTitle: "text-white font-bold",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton: "bg-zinc-900 border-border hover:bg-zinc-800 transition-colors",
            formButtonPrimary: "bg-primary hover:opacity-90 transition-opacity",
            footerActionLink: "text-primary hover:text-primary/80"
          }
        }}
      />
    </div>
  );
}
