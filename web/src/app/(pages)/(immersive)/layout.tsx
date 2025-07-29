    "use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ArrowLeft, Sun, Moon, LogOut, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ImmersiveLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      toast.error("Session expired", {
        description: "Your session has expired. Please log in again.",
      });
      signOut({ callbackUrl: '/signin' });
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background has-noise-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const user = session?.user;
  const userInitials = user?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || user?.email?.[0].toUpperCase() || 'U';

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground has-noise-background">
      {/* --- Minimal Immersive Header --- */}
      <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 shrink-0 z-50">
        <Button asChild variant="outline" size="icon" className="h-8 w-8">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Dashboard</span>
          </Link>
        </Button>
        <div className="flex-1">
          {/* This space can be used for global context if needed later */}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user?.id}`} alt={user?.name || 'User'} className="object-bottom" />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="font-semibold">{user?.name}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/signin' })} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* --- Main Content Area (The Chat Page) --- */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
