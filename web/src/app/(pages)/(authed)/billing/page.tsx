"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { CheckCircle, Download, Loader2, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const scholarPlanFeatures = [
  "Unlimited Dialogues",
  "Access to the full Historical Archive",
  "Advanced Source Analysis",
  "Priority Support",
];

export default function BillingPage() {
  const { data: session, status } = useSession();
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const handleCreateSession = async (endpoint: 'create-checkout-session' | 'create-portal-session') => {
    if (status !== 'authenticated') {
      toast.error("You must be logged in to manage billing.");
      return;
    }

    setIsCreatingSession(true);
    const toastId = toast.loading("Redirecting to billing portal...");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.accessToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create billing session.");
      }

      const { url } = await response.json();
      toast.dismiss(toastId);
      window.location.href = url; // Redirect to Stripe
    } catch (error: any) {
      toast.error("Error", { id: toastId, description: error.message });
      setIsCreatingSession(false);
    }
  };

  const isScholar = session?.user?.stripe_subscription_status === 'active';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground">Manage your subscription and billing details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You are currently on the{' '}
            <span className="font-semibold text-primary">{isScholar ? 'Scholar Plan' : 'Hobby Plan'}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isScholar ? (
            // --- UI for Active Scholar Subscribers ---
            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$20</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Your plan is currently <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">Active</Badge>.
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                {scholarPlanFeatures.map(feature => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            // --- UI for Hobby/Free Users ---
            <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-6 text-center">
              <Award className="mx-auto h-12 w-12 text-primary" />
              <h3 className="mt-4 text-2xl font-semibold">Upgrade to Scholar</h3>
              <p className="mt-2 text-muted-foreground">
                Unlock unlimited dialogues, full archive access, and advanced features.
              </p>
              <Button
                size="lg"
                className="mt-6"
                onClick={() => handleCreateSession('create-checkout-session')}
                disabled={isCreatingSession}
              >
                {isCreatingSession ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Upgrade for $20/month
              </Button>
            </div>
          )}
        </CardContent>
        {isScholar && (
          <CardFooter className="border-t pt-6">
            <Button onClick={() => handleCreateSession('create-portal-session')} disabled={isCreatingSession}>
              {isCreatingSession ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Manage Subscription
            </Button>
            <p className="ml-auto text-sm text-muted-foreground">
              Manage your billing, invoices, and payment method via Stripe.
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
