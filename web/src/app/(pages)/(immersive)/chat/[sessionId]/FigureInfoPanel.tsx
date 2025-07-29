// File: web/src/app/(pages)/(authed)/chat/[sessionId]/FigureInfoPanel.tsx
"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, Landmark, BookOpen, Image as ImageIcon } from "lucide-react";

// The interface defining the data structure for a historical figure
export interface Figure {
  name: string;
  bio: string;
  timeline: { year: string; event: string }[];
  sources: string[];
  media: { type: 'image' | 'video'; url: string; caption: string }[];
}

// Props for the component
interface FigureInfoPanelProps {
  figure: Figure | undefined; // Can be undefined while loading
}

export function FigureInfoPanel({ figure }: FigureInfoPanelProps) {
  if (!figure) {
    return (
      <div className="flex flex-col h-full bg-muted/30 rounded-lg border p-4 space-y-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-6 w-full" />
        <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-muted/30 rounded-lg border">
      {/* Panel Header */}
      <div className="p-4 border-b">
        <h1 className="text-2xl font-semibold [font-family:var(--font-eb-garamond)]">
          Study: {figure.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Primary sources and context for your dialogue.
        </p>
      </div>

      {/* Tabbed Navigation for Different Info Sections */}
      <Tabs defaultValue="biography" className="flex-1 flex flex-col">
        <TabsList className="m-2">
          <TabsTrigger value="biography"><ScrollText className="h-4 w-4 mr-2"/>Biography</TabsTrigger>
          <TabsTrigger value="timeline"><Landmark className="h-4 w-4 mr-2"/>Timeline</TabsTrigger>
          <TabsTrigger value="sources"><BookOpen className="h-4 w-4 mr-2"/>Sources</TabsTrigger>
          <TabsTrigger value="media"><ImageIcon className="h-4 w-4 mr-2"/>Media</TabsTrigger>
        </TabsList>

        {/* Scrollable container for tab content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">

          {/* Biography Tab */}
          <TabsContent value="biography">
            <Card>
              <CardHeader>
                <CardTitle>Biography</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none [font-family:var(--font-eb-garamond)]">
                <p>{figure.bio}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Key Events</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {figure.timeline.map((item, i) => (
                    <li key={i} className="flex gap-4 text-sm">
                      <span className="font-semibold text-muted-foreground w-16 shrink-0">{item.year}</span>
                      <span>{item.event}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle>Primary Sources Used</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {figure.sources.map((source, i) => <li key={i}>{source}</li>)}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Gallery Tab */}
          <TabsContent value="media">
            <Card>
                <CardHeader>
                    <CardTitle>Gallery</CardTitle>
                    <CardDescription>Visual references from the period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {figure.media?.map((item, index) => (
                            <div key={index} className="group relative overflow-hidden rounded-lg h-40">
                                {item.type === 'image' && (
                                    <Image
                                        src={item.url}
                                        alt={item.caption}
                                        fill={true}
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        sizes="(max-width: 1280px) 50vw, 25vw"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 p-2">
                                    <p className="text-xs text-white/90">{item.caption}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
