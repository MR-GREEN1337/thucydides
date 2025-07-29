"use client";

import { SessionProvider } from "next-auth/react";
import React, { ReactNode } from "react";
import { SWRConfig } from 'swr';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// NOTE: We will create a real `useAuthedFetch` hook later.
// For now, this placeholder is removed to avoid confusion.

interface AppProvidersProps {
  children: ReactNode;
  apiUrl: string;
}

export const AppProviders = ({ children, apiUrl }: AppProvidersProps) => {
  return (
    <SessionProvider>
      <TooltipProvider delayDuration={150}>
        <SWRConfig value={{
            onError: (error) => {
                toast.error("Error", { description: error.message });
            }
        }}>
            {children}
        </SWRConfig>
      </TooltipProvider>
    </SessionProvider>
  );
};
