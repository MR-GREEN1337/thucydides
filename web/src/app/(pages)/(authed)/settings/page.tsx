"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [fullName, setFullName] = useState(session?.user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Saving your profile...");

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      if (fullName.length < 3) {
        throw new Error("Full name must be at least 3 characters long.");
      }

      // In a real app, you would make a PATCH request to your backend:
      // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, { ... });

      // If successful, update the NextAuth session to reflect changes immediately
      await updateSession({ name: fullName });

      toast.success("Profile updated successfully!", { id: toastId });
    } catch (error: any) {
      toast.error("Update failed", { id: toastId, description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt("This action is irreversible. To confirm, please type 'DELETE' below:");
    if (confirmation !== 'DELETE') {
        toast.info("Account deletion cancelled.");
        return;
    }

    setIsDeleting(true);
    const toastId = toast.loading("Deleting your account...");

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real app, you would make a DELETE request to your backend and then sign out.
    toast.success("Account has been deleted.", { id: toastId });
    // In a real app, you would call signOut({ callbackUrl: '/' }); here
    setIsDeleting(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <form onSubmit={handleProfileUpdate}>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details here. Your email address cannot be changed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={session?.user?.email || ''} disabled />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                  <div>
                      <h3 className="font-semibold text-destructive">Delete Account</h3>
                      <p className="text-sm text-destructive/80">Permanently remove your account and all associated data.</p>
                  </div>
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete
                  </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
