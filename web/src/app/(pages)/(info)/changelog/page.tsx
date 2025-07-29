// File: web/src/app/(pages)/(info)/changelog/page.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const changelogData = [
  {
    version: "0.1.0",
    date: "July 29, 2024",
    title: "Public Beta Launch",
    changes: [
      { type: "New", description: "Launched Thucydides platform, enabling dialogues with historical figures." },
      { type: "New", description: "Implemented core dialogue engine with Gemini for natural language responses." },
      { type: "New", description: "Created user authentication system with email/password and Google OAuth." },
      { type: "New", description: "Designed and built 'The Archive' for browsing figures and the immersive 'Dialogue Chamber'." },
      { type: "Improved", description: "Optimized streaming responses for faster, more fluid conversations." },
    ],
  },
  {
    version: "0.0.5",
    date: "July 25, 2024",
    title: "Internal Alpha: RAG & Search",
    changes: [
      { type: "New", description: "Introduced Collaborative AI Search to find figures using natural language queries." },
      { type: "New", description: "Added a full-featured settings page for profile and account management." },
      { type: "Improved", description: "Refined the historical figure data model to include detailed biographical information, timelines, and media." },
      { type: "Fixed", description: "Addressed a 422 Unprocessable Entity error in the figure search API." },
    ],
  },
  {
    version: "0.0.1",
    date: "July 20, 2024",
    title: "Project Inception",
    changes: [
      { type: "New", description: "Initialized FastAPI backend and Next.js frontend projects." },
      { type: "New", description: "Established database schema for users, projects, and dialogues." },
      { type: "New", description: "Set up basic project structure and CI/CD pipelines." },
    ],
  },
];

const badgeColors = {
  New: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Improved: "bg-green-500/20 text-green-300 border-green-500/30",
  Fixed: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Security: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function ChangelogPage() {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="[font-family:var(--font-eb-garamond)] text-5xl font-bold tracking-tight text-white">
          Changelog
        </h1>
        <p className="mt-2 text-lg text-zinc-300">
          Tracking all the new features, improvements, and bug fixes.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-1.5 top-0 h-full w-px bg-white/10" />
        <div className="space-y-10">
          {changelogData.map((version) => (
            <div key={version.version} className="relative pl-8">
              <div className="absolute -left-[5px] top-1 h-3 w-3 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
              <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-2xl font-semibold text-white">
                    Version {version.version}
                  </h2>
                  <p className="text-sm text-zinc-400">{version.date}</p>
                </div>
                {version.title && (
                  <p className="text-zinc-300">{version.title}</p>
                )}
                <ul className="space-y-3 pt-2">
                  {version.changes.map((change, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Badge
                        variant="outline"
                        className={cn("mt-0.5", badgeColors[change.type as keyof typeof badgeColors])}
                      >
                        {change.type}
                      </Badge>
                      <span className="text-zinc-300">{change.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
