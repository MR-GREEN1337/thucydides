// File: web/src/hooks/useStartDialogue.ts
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export function useStartDialogue() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isStarting, setIsStarting] = useState<string | null>(null);

  const startDialogue = async (figureId: string) => {
    if (!session?.accessToken) {
      toast.error("Authentication Error", { description: "You must be logged in." });
      return;
    }

    setIsStarting(figureId);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/dialogues/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ figure_id: figureId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create the session.");
      }

      toast.success("Dialogue started!");
      router.push(`/chat/${figureId}`);

    } catch (error: any) {
      toast.error("Failed to start dialogue", { description: error.message });
    } finally {
      setIsStarting(null);
    }
  };

  return { startDialogue, isStarting };
}
