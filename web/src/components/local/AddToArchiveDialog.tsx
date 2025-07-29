"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useSession } from 'next-auth/react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Loader2, Dices } from 'lucide-react';

// --- Form Schema and Type for Submission ---
const sourceSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
});

const submissionSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  era: z.string().min(3, { message: "Era is required." }),
  field: z.string().min(3, { message: "Field is required." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  avatarUrl: z.string().url({ message: "Please provide a valid image URL." }),
  sources: z.array(sourceSchema).min(1, { message: "At least one source is required." }),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

export function AddToArchiveDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { name: "", era: "", field: "", description: "", avatarUrl: "", sources: [{ url: "" }] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sources",
  });

  // Watch fields to make the form more interactive
  const avatarUrl = form.watch("avatarUrl");
  const figureName = form.watch("name");

  const handleGenerateAvatar = () => {
    const seed = figureName.trim().replace(/\s+/g, '') || Math.random().toString(36).substring(7);
    const generatedUrl = `https://api.dicebear.com/8.x/adventurer/svg?seed=${seed}`;
    form.setValue("avatarUrl", generatedUrl, { shouldValidate: true, shouldDirty: true });
    toast.info("Generated a random avatar URL.", {
        description: "You can generate a new one by changing the name and clicking again."
    })
  };

  const onSubmit = async (data: SubmissionFormData) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const toastId = toast.loading("Submitting figure for review...");

    try {
        const response = await fetch(`${apiUrl}/api/v1/figures/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.accessToken}` },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Submission failed.");
        }

        toast.success("Submission successful!", { id: toastId, description: `${data.name} has been added to the review queue.` });
        form.reset();
        setIsOpen(false);
    } catch (error: any) {
        toast.error("Submission Failed", { id: toastId, description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Figure
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Submit a New Figure</DialogTitle>
          <DialogDescription>Contribute to the archive. All submissions are reviewed before being added.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <Card>
                <CardHeader><CardTitle>Figure Dossier</CardTitle><CardDescription>Provide the core identity and background.</CardDescription></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-4 gap-y-2">
                    <div className="space-y-1.5"><Label htmlFor="name">Full Name</Label><Input id="name" {...form.register("name")} placeholder="e.g., Albert Einstein" /><p className="text-xs text-destructive h-4">{form.formState.errors.name?.message}</p></div>
                    <div className="space-y-1.5"><Label htmlFor="era">Historical Era</Label><Input id="era" {...form.register("era")} placeholder="e.g., 20th Century" /><p className="text-xs text-destructive h-4">{form.formState.errors.era?.message}</p></div>
                    <div className="md:col-span-2 space-y-1.5"><Label htmlFor="avatarUrl">Avatar URL</Label><div className="flex items-center gap-2">{avatarUrl && !form.formState.errors.avatarUrl && (<img src={avatarUrl} alt="Preview" className="h-10 w-10 rounded-full border bg-muted p-0.5" />)}<Input id="avatarUrl" {...form.register("avatarUrl")} placeholder="Paste an image URL or generate one" className="flex-1" /><Button type="button" variant="secondary" size="icon" className="shrink-0" onClick={handleGenerateAvatar} title="Generate Random Avatar (uses name as seed)"><Dices className="h-4 w-4" /></Button></div><p className="text-xs text-destructive h-4">{form.formState.errors.avatarUrl?.message}</p></div>
                    <div className="space-y-1.5"><Label htmlFor="field">Primary Field</Label><Input id="field" {...form.register("field")} placeholder="e.g., Physics" /><p className="text-xs text-destructive h-4">{form.formState.errors.field?.message}</p></div>
                    <div className="md:col-span-2 space-y-1.5"><Label htmlFor="description">Brief Description</Label><Textarea id="description" {...form.register("description")} placeholder="A short biography outlining their significance..." /><p className="text-xs text-destructive h-4">{form.formState.errors.description?.message}</p></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Primary Sources</CardTitle><CardDescription>Add links to source materials (e.g., Project Gutenberg).</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-start gap-2">
                            <div className="flex-1">
                                <Input placeholder="https://www.gutenberg.org/files/..." {...form.register(`sources.${index}.url`)} />
                                <p className="text-xs text-destructive h-4">{form.formState.errors.sources?.[index]?.url?.message}</p>
                            </div>
                            <Button type="button" variant="outline" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}><X className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    <p className="text-xs text-destructive h-4">{form.formState.errors.sources?.message}</p>
                    <Button type="button" variant="secondary" size="sm" onClick={() => append({ url: "" })}><Plus className="mr-2 h-4 w-4" /> Add Source</Button>
                </CardContent>
            </Card>
        </form>
        <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit for Review
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
