"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowRight, Paperclip, Mic, Bot, Zap, AlertTriangle, Loader2, X, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStartDialogue } from "@/hooks/useStartDialogue";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// --- TYPES ---
interface Step { id: string; type: 'log' | 'match' | 'error'; payload: any; }
interface Figure { id: string; name: string; avatar: string; }

// --- CHILD COMPONENTS ---

// FIXED: Corrected the JSX syntax here
const SoundWave = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
        {
            [0, 1, 2, 3].map(i => (
                <motion.div
                    key={i}
                    className="w-1 bg-blue-500"
                    animate={{ scaleY: [1, 1.5, 2.5, 1.5, 1], transition: { duration: 1.2, repeat: Infinity, delay: i * 0.2 } }}
                />
            ))
        }
    </motion.div>
);

// FIXED: Corrected the JSX syntax and formatting for readability
const StepItem = ({ step, onMatchSelect, isStarting }: { step: Step, onMatchSelect: (figureId: string) => void, isStarting: string | null }) => {
    const ICONS = {
        log: <Bot className="h-4 w-4 text-primary" />,
        match: <Zap className="h-4 w-4 text-amber-500" />,
        error: <AlertTriangle className="h-4 w-4 text-destructive" />,
    };

    const renderContent = () => {
        if (step.type === 'match') {
            const figure = step.payload as Figure;
            return (
                <Button variant="outline" className="w-full justify-start h-auto p-3" onClick={() => onMatchSelect(figure.id)} disabled={!!isStarting}>
                    {isStarting === figure.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <img src={figure.avatar} alt={figure.name} className="h-8 w-8 rounded-full mr-3 object-cover object-bottom" />}
                    <div className="text-left">
                        <p className="font-semibold">{figure.name}</p>
                        <p className="text-xs text-muted-foreground">Click to start dialogue</p>
                    </div>
                </Button>
            );
        }
        return <p className="text-foreground/90">{step.payload}</p>;
    };

    return (
        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-start gap-4 text-sm">
            <div className="flex-shrink-0 mt-1.5 p-1.5 bg-muted rounded-full">{ICONS[step.type]}</div>
            <div className={cn("flex-grow pt-1", step.type === 'error' && "text-destructive font-medium")}>{renderContent()}</div>
        </motion.div>
    );
};

// --- MAIN COMPONENT ---
export function CollaborativeSearch() {
    const { data: session } = useSession();
    const { startDialogue, isStarting } = useStartDialogue();

    const [query, setQuery] = useState("");
    const [contextFile, setContextFile] = useState<File | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [logSteps, setLogSteps] = useState<Step[]>([]);
    const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [logSteps]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event) => {
                const transcript = Array.from(event.results).map(result => result[0]).map(result => result.transcript).join('');
                setQuery(transcript);
            };
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event) => {
                toast.error("Voice Recognition Error", { description: event.error });
                setIsListening(false);
            };
            recognitionRef.current = recognition;
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File is too large", { description: "Please select a file smaller than 5MB." });
                return;
            }
            setContextFile(file);
            toast.success("File added for context", { description: file.name });
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error("Voice input not supported", { description: "Your browser does not support the Web Speech API." });
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setQuery("");
            recognitionRef.current.start();
        }
        setIsListening(!isListening);
    };

    const handleSearch = async () => {
        if (!query.trim() || isSearching) return;
        setIsSearching(true);
        setLogSteps([]);

        try {
            const formData = new FormData();
            formData.append('query', query);
            if (contextFile) {
                formData.append('file', contextFile);
            }
            formData.append('use_web_search', String(isWebSearchEnabled));

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/figures/search`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.accessToken}` },
                body: formData,
            });
            if (!response.ok || !response.body) throw new Error("Server connection error or invalid response.");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || "";
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.substring(6));
                        if (data.type === 'done') return;
                        setLogSteps(prev => [...prev, { id: `step-${Date.now()}-${Math.random()}`, ...data }]);
                    }
                }
            }
        } catch (err: any) {
            toast.error("Search Failed", { description: err.message });
            setLogSteps([{ id: 'error-1', type: 'error', payload: 'An unexpected error occurred during the search.' }]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleReset = useCallback(() => {
        setIsSearching(false);
        setLogSteps([]);
        setQuery("");
        setContextFile(null);
        if (isListening) {
            recognitionRef.current?.stop();
        }
    }, [isListening]);

    if (isSearching || logSteps.length > 0) {
        return (
            <div className="w-full rounded-lg border bg-muted/40 p-4 transition-all">
                <div className="space-y-1 text-center text-sm rounded-lg border bg-background/50 p-3 mb-4">
                    <p className="text-muted-foreground">Finding figure for:</p>
                    <p className="font-semibold text-foreground">"{query}"</p>
                </div>
                <ScrollArea className="h-60 w-full pr-4" ref={scrollAreaRef}>
                    <div className="space-y-5">
                        <AnimatePresence>
                            {logSteps.map((step) => <StepItem key={step.id} step={step} onMatchSelect={startDialogue} isStarting={isStarting} />)}
                        </AnimatePresence>
                        {isSearching && logSteps.length > 0 && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground animate-pulse"><Loader2 className="h-4 w-4 animate-spin"/><span>Thinking...</span></div>
                        )}
                    </div>
                </ScrollArea>
                <div className="mt-4 border-t pt-4">
                    <Button onClick={handleReset} variant="ghost" className="w-full" disabled={isStarting !== null}>
                        Start New Search
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
             <div className={cn("relative rounded-lg border bg-background transition-shadow,border", isListening && "border-blue-500 shadow-md shadow-blue-500/20")}>
                <Textarea
                    placeholder="Describe a figure to begin... (e.g., the stoic roman emperor who wrote meditations)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[80px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-24"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch(); } }}
                    disabled={isListening}
                />
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                    <Button size="sm" onClick={handleSearch} disabled={!query.trim() || isSearching}>
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find'}
                    </Button>
                </div>
                {isListening && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                        <SoundWave />
                        <p className="mt-2 text-sm text-blue-500 animate-pulse">Listening...</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center">
                <TooltipProvider>
                <div className="flex items-center gap-1">
                     <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title="Add context file">
                        <Paperclip className="h-4 w-4 mr-1" /> Add Context
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.pdf,.md" />
                    <Button variant="ghost" size="sm" onClick={toggleListening} title={isListening ? "Stop listening" : "Speak query"} className={cn(isListening && "text-blue-500")}>
                        <Mic className="h-4 w-4 mr-1" /> Speak Query
                    </Button>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setIsWebSearchEnabled(prev => !prev)} className={cn(isWebSearchEnabled && "bg-primary/10 text-primary")}>
                                <Globe className="h-4 w-4 mr-1" /> Modern Context
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isWebSearchEnabled ? "ON: AI will use general knowledge." : "OFF: AI will only use archive data."}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                </TooltipProvider>
                 <AnimatePresence>
                    {contextFile && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="flex items-center justify-between rounded-md border bg-muted/50 py-1 pl-2 pr-1 text-sm">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Paperclip className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <span className="truncate text-muted-foreground">{contextFile.name}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => setContextFile(null)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
