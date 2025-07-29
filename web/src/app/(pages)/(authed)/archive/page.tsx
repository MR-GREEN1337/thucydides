"use client";

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { CollaborativeSearch } from '@/components/local/CollaborativeSearch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Search, AlertTriangle, Loader2, ChevronRight } from 'lucide-react';
import { useStartDialogue } from '@/hooks/useStartDialogue';

interface Figure { id: string; name: string; era: string; title: string; description: string; avatar: string; }
const authedFetcher = async (url: string, accessToken: string | undefined) => { if (!accessToken) throw new Error("Not authorized."); const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, { headers: { Authorization: `Bearer ${accessToken}` }, }); if (!res.ok) { const errorData = await res.json(); throw new Error(errorData.detail || 'Failed to fetch data.'); } return res.json(); };

export default function ArchivePage() {
  const { data: session } = useSession();
  const { startDialogue, isStarting } = useStartDialogue();
  const [searchTerm, setSearchTerm] = useState('');
  const [eraFilter, setEraFilter] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('all');

  const { data: figures, error, isLoading } = useSWR<Figure[]>('/api/v1/figures/archive', (url:any) => authedFetcher(url, session?.accessToken));

  const filteredFigures = useMemo(() => {
    if (!figures) return [];
    return figures.filter(f => {
      const searchMatch = searchTerm ? f.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const eraMatch = eraFilter !== 'all' ? f.era === eraFilter : true;
      const fieldMatch = fieldFilter !== 'all' ? f.title === fieldFilter : true;
      return searchMatch && eraMatch && fieldMatch;
    });
  }, [figures, searchTerm, eraFilter, fieldFilter]);

  const eras = useMemo(() => figures ? [...new Set(figures.map(f => f.era))] : [], [figures]);
  const fields = useMemo(() => figures ? [...new Set(figures.map(f => f.title))] : [], [figures]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">The Archive</h1>
        <p className="text-muted-foreground">Use AI to find a figure, or browse the full collection manually.</p>
      </div>

      <CollaborativeSearch />

      {/* --- NEW: Divider --- */}
      <div className="flex items-center">
        <div className="flex-grow border-t"></div>
        <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase">Or Browse Manually</span>
        <div className="flex-grow border-t"></div>
      </div>

      <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" /><Input placeholder="Filter by name..." className="bg-background pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <Select value={eraFilter} onValueChange={setEraFilter} disabled={!figures}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by Era" /></SelectTrigger><SelectContent><SelectItem value="all">All Eras</SelectItem>{eras.map(era => <SelectItem key={era} value={era}>{era}</SelectItem>)}</SelectContent></Select>
            <Select value={fieldFilter} onValueChange={setFieldFilter} disabled={!figures}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by Field" /></SelectTrigger><SelectContent><SelectItem value="all">All Fields</SelectItem>{fields.map(field => <SelectItem key={field} value={field}>{field}</SelectItem>)}</SelectContent></Select>
          </div>
      </div>

      <div>
        {isLoading && (<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="space-y-3 rounded-lg border p-4"><div className="flex items-center gap-4"><Skeleton className="h-16 w-16 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div><Skeleton className="h-12 w-full" /></div>))}</div>)}
        {error && (<div className="flex flex-col items-center justify-center text-center py-12 bg-muted/50 rounded-lg"><AlertTriangle className="h-10 w-10 text-destructive mb-4" /><h3 className="text-xl font-semibold">Failed to load figures</h3><p className="text-muted-foreground">{error.message}</p></div>)}
        {!isLoading && !error && figures && (
            <>
                {filteredFigures.length === 0 ? (<div className="flex flex-col items-center justify-center text-center py-12 bg-muted/50 rounded-lg"><Search className="h-10 w-10 text-muted-foreground mb-4" /><h3 className="text-xl font-semibold">No figures found</h3><p className="text-muted-foreground">Try adjusting your filters.</p></div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredFigures.map(figure => (
                            <div key={figure.id} className="group flex flex-col justify-between h-full rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/50 hover:shadow-lg">
                                <div className="flex items-start gap-4">
                                    <img src={figure.avatar} alt={figure.name} className="w-16 h-16 rounded-full bg-muted p-1 object-cover object-bottom" />
                                    <div><p className="font-semibold text-lg">{figure.name}</p><p className="text-sm text-muted-foreground">{figure.era} • {figure.title}</p></div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-3 mb-4 flex-1">{figure.description}</p>
                                <Button onClick={() => startDialogue(figure.id)} disabled={!!isStarting} className="w-full">
                                    {isStarting === figure.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                                    Start Dialogue
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}
