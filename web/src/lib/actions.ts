// File: web/src/lib/actions.ts
"use client";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";

export async function startNewDialogue(
  figureId: string,
  accessToken: string | undefined,
  router: AppRouterInstance
) {
  if (!accessToken) {
    toast.error("Authentication Error", {
      description: "You must be logged in to start a dialogue.",
    });
    return;
  }

  toast.info("Starting a new dialogue...", { id: "start-dialogue" });

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/dialogues/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ figure_id: figureId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create the session.");
    }

    // The backend now returns the newly created session, including its ID.
    // We can use this to immediately navigate to the chat page.
    const newSession = await response.json();

    toast.success("Dialogue started!", { id: "start-dialogue" });

    // Navigate to the chat page for the figure, the page will handle finding the new session.
    router.push(`/chat/${figureId}`);

  } catch (error: any) {
    toast.error("Failed to start dialogue", {
      id: "start-dialogue",
      description: error.message,
    });
  }
}
