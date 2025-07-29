"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Logo } from "@/components/global/logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ChevronsUpDown, LayoutGrid, BookUser, CreditCard, Settings, LifeBuoy, LogOut,
  HelpCircle, MessageSquare, PanelLeftClose, PanelLeftOpen, Sun, Moon, FolderKanban,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/archive", icon: BookUser, label: "The Archive" },
  { href: "/billing", icon: CreditCard, label: "Billing" },
];

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(true);

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
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const user = session?.user;
  const userInitials = user?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2) || user?.email?.[0].toUpperCase() || 'U';

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden has-noise-background">
        <aside className={cn(
          "hidden md:flex flex-col border-r bg-muted/40 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[56px]" : "w-[200px]"
        )}>
          {/* ... Sidebar content is unchanged ... */}
           <div className={cn("flex h-14 items-center border-b", isCollapsed ? "justify-center px-2" : "px-4")}>
             <Logo hideText={isCollapsed} href="/dashboard" />
           </div>
           <nav className="flex-1 space-y-1 p-2">
             {navItems.map((item) => (
               <Tooltip key={item.label} delayDuration={0}>
                 <TooltipTrigger asChild>
                   <Link href={item.href} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground",)}>
                     <item.icon className="h-4 w-4" />
                     <span className={cn("truncate", isCollapsed && "hidden")}>{item.label}</span>
                   </Link>
                 </TooltipTrigger>
                 {isCollapsed && (<TooltipContent side="right">{item.label}</TooltipContent>)}
               </Tooltip>
             ))}
           </nav>
           <div className="mt-auto border-t p-2">
             <Tooltip delayDuration={0}>
               <TooltipTrigger asChild>
                 <Link href="/settings" className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground",)}>
                   <Settings className="h-4 w-4" />
                   <span className={cn("truncate", isCollapsed && "hidden")}>Settings</span>
                 </Link>
               </TooltipTrigger>
               {isCollapsed && (<TooltipContent side="right">Settings</TooltipContent>)}
             </Tooltip>
             <Tooltip delayDuration={0}>
               <TooltipTrigger asChild>
                 <Button onClick={() => setIsCollapsed(!isCollapsed)} variant="ghost" className="mt-1 w-full justify-start gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
                   {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                   <span className={cn("truncate", isCollapsed && "hidden")}>Collapse</span>
                 </Button>
               </TooltipTrigger>
               {isCollapsed && (<TooltipContent side="right">Expand</TooltipContent>)}
             </Tooltip>
           </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-6 shrink-0">
            {/* ... Header project dropdown is unchanged ... */}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-between max-w-xs">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-zinc-700/50">
                          <FolderKanban className="size-4 text-zinc-300"/>
                      </div>
                      <span className="font-semibold">My First Project</span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  <DropdownMenuLabel>My Projects</DropdownMenuLabel>
                  <DropdownMenuItem>My First Project</DropdownMenuItem>
                  <DropdownMenuItem>Philosophy 101</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Create New Project</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            <div className="ml-auto flex items-center gap-2">
              {/* ... Header buttons are unchanged ... */}
              <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8"><HelpCircle className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8"><MessageSquare className="h-4 w-4" /></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /><Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" /><span className="sr-only">Toggle theme</span></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem><DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem><DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem></DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user?.image || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user?.id}`}
                        alt={user?.name || 'User'}
                        className="object-bottom"
                      />
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
                    <DropdownMenuItem asChild>
                        <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        <span>Support</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/signin' })} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-6 bg-muted/20 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
