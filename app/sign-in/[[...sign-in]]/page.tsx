import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-[#0c0c10]">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(124,58,237,0.15),_transparent_50%)] -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[140px] -z-10 rounded-full animate-pulse" />
      
      <SignIn 
        appearance={{
          elements: {
            rootBox: "w-full flex justify-center",
            cardBox: "w-full max-w-md",
          }
        }}
      />
    </div>
  );
}
