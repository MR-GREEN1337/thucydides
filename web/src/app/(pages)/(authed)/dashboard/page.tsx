// File: web/src/app/(pages)/(authed)/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from 'swr';
import { formatDistanceToNow } from 'date-fns';
import { motion } from "framer-motion";

import { Plus, Search, ArrowRight, BookUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { startNewDialogue } from "@/lib/actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// --- Type Definitions ---
interface FeaturedFigure {
  id: string;
  name: string;
  era: string;
  description: string;
  avatar: string;
}

interface ActiveDialogue {
  figure_id: string;
  figure_name: string;
  figure_avatar: string;
  last_active: string;
  session_id: string;
}

// --- Data Fetcher ---
const authedFetcher = async (url: string, accessToken: string | undefined) => {
    if (!accessToken) throw new Error("Not authorized.");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to fetch data.');
    }
    return res.json();
};

// --- Main Component ---
export default function Dashboard() {
  const router = useRouter();
  const { data: session } = useSession();

  const { data: featuredFigures, isLoading: figuresLoading } = useSWR<FeaturedFigure[]>(
    session?.accessToken ? '/api/v1/figures/featured' : null,
    (url) => authedFetcher(url, session?.accessToken)
  );

  const { data: activeDialogues, isLoading: dialoguesLoading } = useSWR<ActiveDialogue[]>(
    session?.accessToken ? '/api/v1/dialogues/recent' : null,
    (url) => authedFetcher(url, session?.accessToken)
  );

  const handleStartConversation = (figureId: string) => {
    startNewDialogue(figureId, session?.accessToken, router);
  };

  const userName = session?.user?.name?.split(' ')[0] || 'Scholar';

  return (
    <div className="flex flex-col gap-10">
      {/* --- Header & Welcome CTA --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="rounded-xl bg-gradient-to-br from-slate-50 to-zinc-100 border border-slate-200 dark:from-slate-900 dark:to-zinc-900/80 dark:border-slate-800 p-8 shadow-lg dark:shadow-2xl"
      >
        <h1 className="text-4xl font-bold [font-family:var(--font-eb-garamond)] text-slate-900 dark:text-slate-100">
          Welcome back, {userName}.
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
          Continue your journey through history or begin a new dialogue with one of the greatest minds of the past.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Who would you like to speak with? (e.g., Socrates, Cleopatra...)"
                className="bg-white border-slate-300 dark:bg-zinc-900/50 dark:border-slate-700 h-12 pl-12 text-base"
              />
            </div>
            <Button asChild size="lg" className="h-12 bg-blue-600 text-white hover:bg-blue-700">
              <Link href="/archive">
                <BookUser className="mr-2 h-5 w-5" />
                Browse The Archive
              </Link>
            </Button>
        </div>
      </motion.div>

      {/* --- Recent Dialogues Section --- */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Continue Where You Left Off</h2>
        {dialoguesLoading ? (
            <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-64 rounded-lg shrink-0" />
                ))}
            </div>
        ) : activeDialogues && activeDialogues.length > 0 ? (
          <div className="relative">
            <div className="flex gap-4 pb-4 overflow-x-auto [scrollbar-width:thin] [scrollbar-color:#a1a1aa_#f4f4f5] dark:[scrollbar-color:#374151_#111827]">
              {activeDialogues.map((dialogue) => (
                <Link href={`/chat/${dialogue.figure_id}`} key={dialogue.session_id} className="block shrink-0 w-64">
                  <div className="group flex items-center gap-4 rounded-lg border border-border bg-card p-3 h-full transition-all hover:bg-muted/80 hover:border-slate-300 dark:hover:bg-slate-800/60 dark:hover:border-slate-700">
                    <Avatar className="h-12 w-12 border-2 border-border">
                      <AvatarImage src={dialogue.figure_avatar} alt={dialogue.figure_name} className="object-bottom" />
                      <AvatarFallback>{dialogue.figure_name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{dialogue.figure_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(dialogue.last_active), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-muted/20 to-transparent pointer-events-none"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-semibold">No Active Dialogues</h3>
              <p className="text-muted-foreground">Start a new conversation to see it here.</p>
          </div>
        )}
      </div>

      {/* --- Featured Figures Section --- */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Get Inspired</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {figuresLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))
          ) : (
            featuredFigures?.map(figure => (
              <div
                key={figure.id}
                className="group relative flex flex-col justify-end h-64 rounded-xl border border-border overflow-hidden cursor-pointer transition-all hover:border-blue-600/50 hover:shadow-2xl hover:shadow-blue-900/20"
                onClick={() => handleStartConversation(figure.id)}
              >
                <img src={figure.avatar} alt={figure.name} className="absolute inset-0 w-full h-full object-cover object-bottom transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="relative p-4 z-10">
                  <h3 className="text-xl font-semibold text-white">{figure.name}</h3>
                  <p className="text-sm text-slate-300">{figure.description}</p>
                  <Button variant="outline" size="sm" className="mt-4 w-full bg-white/10 border-white/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/20">
                    Start Conversation <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
