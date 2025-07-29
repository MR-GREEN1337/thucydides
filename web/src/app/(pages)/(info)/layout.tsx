// File: web/src/app/(pages)/(info)/layout.tsx
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/global/footer";
import { Logo } from "@/components/global/logo";
import { Button } from "@/components/ui/button";

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-white has-noise-background">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/50 p-4 font-sans backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between">
          <Logo />
          <Button asChild variant="ghost" className="hover:bg-white/10">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto max-w-4xl px-4 py-10 md:py-16">
        {children}
      </main>
      <div className="relative z-10 p-4">
        <Footer />
      </div>
    </div>
  );
}
