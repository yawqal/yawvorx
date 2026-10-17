"use client";
import { useState } from "react";
import { ProjectCard } from "@/components/cards/Cards";
import { EmptyState } from "@/components/ui/States";
import type { Project } from "@/data/portfolio";

export function PortfolioBrowser({ projects }: { projects: Project[] }) {
  const [cat, setCat] = useState<string>("All");
  const categories = [...new Set(projects.map((project) => project.category).filter(Boolean))].sort();
  const shown = cat === "All" ? projects : projects.filter((p) => p.category === cat);
  if (projects.length === 0) return <EmptyState title="No projects yet" description="Published projects will appear here." />;
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {["All", ...categories].map((c) => (
          <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
            className={`min-h-[44px] rounded-xl border px-4 text-sm transition ${cat === c ? "border-cyan bg-cyan/10 text-cyan-soft" : "border-line text-ink-mute hover:text-ink"}`}>{c}</button>
        ))}
      </div>
      {shown.length === 0
        ? <div className="mt-6"><EmptyState title="Nothing in this category yet" /></div>
        : <div className="mt-6 grid gap-5 sm:grid-cols-2">{shown.map((p) => <ProjectCard key={p.slug} p={p} />)}</div>}
    </div>
  );
}
