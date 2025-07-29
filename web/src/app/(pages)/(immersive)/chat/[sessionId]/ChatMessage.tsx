"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BookOpen, User, Copy, Pin, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { text: string; source:string }[];
  created_at: string;
}

interface ChatMessageProps {
  message: Message;
  figure: { name: string; avatar: string };
  userAvatar: string | null | undefined;
}

export function ChatMessage({ message, figure, userAvatar }: ChatMessageProps) {
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex items-start gap-4">
      {/* Assistant Avatar */}
      {!isUser && (
        <Avatar className="h-8 w-8 border">
          <AvatarImage src={figure.avatar} alt={figure.name} />
          <AvatarFallback>{figure.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 flex flex-col items-start group">
        <div className={cn(
          "max-w-xl rounded-lg px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground self-end"
            : "bg-muted"
        )}>
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:mt-0 [font-family:var(--font-eb-garamond)]">
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>

          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 border-t pt-2">
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Sources
              </h4>
              <div className="space-y-2">
                {message.citations.map((citation, index) => (
                  <div key={index} className="text-xs p-2 rounded-md bg-background/50">
                    <p className="italic">"{citation.text}"</p>
                    <p className="text-right font-medium text-muted-foreground mt-1">— {citation.source}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons for Assistant Messages */}
        {!isUser && message.content && (
            <div className="mt-2 flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Feature coming soon!")}>
                    <Pin className="h-4 w-4"/>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                    <Copy className="h-4 w-4"/>
                </Button>
                 <Button variant="ghost" size="icon" className="h-7 w-7">
                    <ThumbsUp className="h-4 w-4"/>
                </Button>
                 <Button variant="ghost" size="icon" className="h-7 w-7">
                    <ThumbsDown className="h-4 w-4"/>
                </Button>
            </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <Avatar className="h-8 w-8 border">
          <AvatarImage src={userAvatar || undefined} />
          <AvatarFallback>
            <User className="h-4 w-4 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
