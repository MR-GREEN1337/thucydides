"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Loader2, Globe, AtSign, ChevronsUpDown, Plus, ShieldCheck, BookOpen, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { ChatMessage, Message } from './ChatMessage';
import { FigureInfoPanel, Figure } from './FigureInfoPanel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { startNewDialogue } from '@/lib/actions';

// --- (Types and Fetcher are unchanged) ---
interface DialogueSession { id: string; created_at: string; }
const authedFetcher = async (url: string, accessToken: string | undefined) => { if (!accessToken) throw new Error("Not authorized."); const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, { headers: { Authorization: `Bearer ${accessToken}` }, }); if (!res.ok) { const errorData = await res.json(); throw new Error(errorData.detail || 'An error occurred while fetching data.'); } return res.json(); };

// --- Main Component ---
export default function AdvancedChatPage() {
    // --- (Hooks and state setup are mostly unchanged) ---
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const accessToken = session?.accessToken;
    const figureId = params.sessionId as string;
    const [activeDialogueId, setActiveDialogueId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- NEW: State for view switching ---
    const [activeView, setActiveView] = useState<'dialogue' | 'study'>('dialogue');

    // --- (Data fetching is unchanged) ---
    const { data: figure, error: figureError, isLoading: isFigureLoading } = useSWR<Figure>(figureId && accessToken ? `/api/v1/figures/${figureId}` : null, (url) => authedFetcher(url, accessToken));
    const { data: sessionHistory, mutate: mutateHistory } = useSWR<DialogueSession[]>(figureId && accessToken ? `/api/v1/dialogues?figure_id=${figureId}` : null, (url) => authedFetcher(url, accessToken));
    const { data: messages, mutate: mutateMessages, error: messagesError, isLoading: isLoadingMessages } = useSWR<Message[]>(activeDialogueId ? `/api/v1/dialogues/${activeDialogueId}/messages` : null, (url) => authedFetcher(url, accessToken));

    // --- (Effects and handlers are unchanged) ---
    useEffect(() => { if (sessionHistory && sessionHistory.length > 0 && !activeDialogueId) { setActiveDialogueId(sessionHistory[0].id); } }, [sessionHistory, activeDialogueId]);
    const currentSession = activeDialogueId ? sessionHistory?.find(s => s.id === activeDialogueId) : null;
    useEffect(() => { if (activeView === 'dialogue') { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); } }, [messages, activeView]);
    const handleNewDialogue = () => { startNewDialogue(figureId, accessToken, router); };

    // MODIFIED: handleSend to include the web search flag
    const handleSend = async () => {
        if (!input.trim() || !activeDialogueId || !accessToken) return;
        setIsSending(true);
        const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: input, created_at: new Date().toISOString() };
        const assistantMessage: Message = { id: `assistant-${Date.now()}`, role: 'assistant', content: '', created_at: new Date().toISOString() };

        await mutateMessages((currentMessages = []) => [...currentMessages, userMessage, assistantMessage], false);

        setInput('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dialogues/${activeDialogueId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({ content: userMessage.content, use_web_search: isWebSearchEnabled }), // Pass the flag
            });
            if (!response.body) throw new Error("Response body is null.");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullResponse += chunk;

                await mutateMessages((currentMessages = []) => {
                    const newMessages = [...currentMessages];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'assistant') {
                        lastMessage.content = fullResponse;
                    }
                    return newMessages;
                }, false);
            }

            // After streaming, refetch messages to get final version with citations
            await mutateMessages();

        } catch (error: any) {
            toast.error("Error sending message", { description: error.message });
            await mutateMessages((currentMessages = []) => currentMessages?.slice(0, -2) || [], false);
        } finally {
            setIsSending(false);
        }
    };

    // --- (Loading and Error states are unchanged) ---
    if (isFigureLoading) { return ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col h-full w-full items-center justify-center gap-4 text-center"> <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /> <div className="flex flex-col gap-1"> <h2 className="text-2xl font-semibold [font-family:var(--font-eb-garamond)]">Consulting the Archives...</h2> <p className="text-muted-foreground">Please wait while we establish a connection with the historical figure.</p> </div> </motion.div> ); }
    if (figureError) { return ( <div className="flex flex-col h-full w-full items-center justify-center text-center p-4"> <h2 className="text-xl font-semibold">Failed to Load Dialogue</h2> <p className="text-muted-foreground max-w-md">Could not retrieve information for this historical figure.</p> <Button asChild className="mt-4"><Link href="/dashboard">Return to Dashboard</Link></Button> </div> ); }

    const viewVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
    };

    return (
      <div className="flex flex-col h-full w-full">
          <header className="p-3 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border"><AvatarImage src={figure?.avatar} alt={figure?.name} className="object-bottom" /><AvatarFallback>{figure?.name.slice(0, 2)}</AvatarFallback></Avatar>
                <div>
                    <h2 className="font-semibold text-base">{figure?.name}</h2>
                    <p className="text-sm text-muted-foreground">{figure?.title}</p>
                </div>
            </div>

            {/* --- NEW: View Switcher --- */}
            <ToggleGroup type="single" value={activeView} onValueChange={(value) => { if (value) setActiveView(value as any) }} className="hidden md:flex">
              <ToggleGroupItem value="dialogue" aria-label="Dialogue view"><MessageSquare className="h-4 w-4 mr-2" />Dialogue</ToggleGroupItem>
              <ToggleGroupItem value="study" aria-label="Study view"><BookOpen className="h-4 w-4 mr-2" />Study</ToggleGroupItem>
            </ToggleGroup>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-52 justify-between">
                    <span className="truncate pr-2 text-left font-normal">{currentSession ? format(new Date(currentSession.created_at), "PPP p") : 'Select Dialogue'}</span>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)]"><DropdownMenuItem onSelect={handleNewDialogue}><Plus className="h-4 w-4 mr-2"/>New Dialogue</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuLabel>History with {figure?.name}</DropdownMenuLabel>{sessionHistory?.map(s => (<DropdownMenuItem key={s.id} onSelect={() => setActiveDialogueId(s.id)}>{format(new Date(s.created_at), "PPP p")}</DropdownMenuItem>))}</DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeView === 'dialogue' && (
                <motion.div
                  key="dialogue"
                  variants={viewVariants}
                  initial="hidden" animate="visible" exit="exit"
                  transition={{ duration: 0.2 }}
                  className="flex flex-col flex-1 overflow-hidden"
                >
                    <main className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* ... (chat message mapping is unchanged) ... */}
                        {isLoadingMessages ? (<div className="space-y-4"><Skeleton className="h-24 w-96"/><Skeleton className="h-16 w-80 ml-auto"/></div>) : messagesError ? (<div className="text-center text-red-500">Error loading messages.</div>) : (messages?.map((msg) => (<ChatMessage key={msg.id} message={msg} figure={figure!} userAvatar={session?.user?.image} />)))}
                        {isSending && messages && messages[messages.length-1]?.role === 'assistant' && !messages[messages.length-1]?.content && (<div className="flex items-start gap-4"><Avatar className="h-8 w-8 border"><AvatarImage src={figure.avatar} alt={figure.name} className="object-bottom"/><AvatarFallback>{figure.name.slice(0,2)}</AvatarFallback></Avatar><div className="flex items-center gap-2 p-3 bg-muted rounded-lg"><span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></span><span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></span><span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></span></div></div>)}
                        <div ref={messagesEndRef} />
                    </main>
                    <footer className="border-t p-4 bg-background space-y-3">
                        {/* ... (footer is unchanged) ... */}
                        <div className="relative rounded-lg border bg-muted/50 shadow-sm"><Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={`Ask ${figure?.name}...`} className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-3 pr-16" disabled={isSending}/><div className="absolute bottom-2 right-2"><Button type="submit" size="icon" onClick={handleSend} disabled={isSending || !input.trim()}>{isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button></div></div><div className="flex items-center gap-2"><TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={cn("h-8 w-8", isWebSearchEnabled && "bg-primary/10 text-primary")} onClick={() => setIsWebSearchEnabled(prev => !prev)}><Globe className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>{isWebSearchEnabled ? "Modern Context: ON" : "Modern Context: OFF"}</p></TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><AtSign className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Mention specific source (e.g. @Meditations)</p></TooltipContent></Tooltip></TooltipProvider><div className="ml-auto text-xs text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-green-500"/><span>Grounded in Primary Sources</span></div></div>
                    </footer>
                </motion.div>
            )}
            {activeView === 'study' && (
                <motion.div
                  key="study"
                  variants={viewVariants}
                  initial="hidden" animate="visible" exit="exit"
                  transition={{ duration: 0.2 }}
                  className="flex-1 overflow-y-auto"
                >
                    <FigureInfoPanel figure={figure} />
                </motion.div>
            )}
          </AnimatePresence>
      </div>
    );
}
