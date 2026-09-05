"use client";

import { useMemo, useState } from "react";
import GithubSlugger from "github-slugger";
import { ChevronDown, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface Heading {
  id: string;
  text: string;
  level: number;
}

function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  const lines = markdown.split("\n");
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      headings.push({ id: slugger.slug(text), text, level });
    }
  }
  return headings;
}

/** Only worth showing for genuinely long answers — otherwise it's noise. */
export default function TableOfContents({ content }: { content: string }) {
  const headings = useMemo(() => extractHeadings(content), [content]);
  const [open, setOpen] = useState(true);

  if (headings.length < 3) return null;

  return (
    <div className="mb-6 rounded-xl border border-border bg-bg-elevated overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-ink-faint"
      >
        <span className="flex items-center gap-2">
          <List size={13} /> Sections
        </span>
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <nav className="px-4 pb-3 space-y-1">
          {headings.map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              className="block text-sm text-ink-dim hover:text-accent transition-colors truncate"
              style={{ paddingLeft: (h.level - 2) * 14 }}
            >
              {h.text}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
