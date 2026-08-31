"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, CornerDownLeft } from "lucide-react";
import { useUI } from "./UIContext";
import { useData } from "@/lib/DataContext";
import { SearchHit } from "@/types/node";
import NodeIcon from "./NodeIcon";

export default function SearchPalette() {
  const { searchOpen, setSearchOpen } = useUI();
  const data = useData();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      data
        .searchNodes(query)
        .then((r) => {
          setResults(r);
          setActiveIndex(0);
        })
        .finally(() => setLoading(false));
    }, 150);
    return () => clearTimeout(handle);
  }, [query, data]);

  function openResult(hit: SearchHit) {
    router.push(`/n/${hit.node.id}`);
    setSearchOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      openResult(results[activeIndex]);
    }
  }

  if (!searchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-3">
      <button aria-label="Close search" className="absolute inset-0 bg-black/50" onClick={() => setSearchOpen(false)} />
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-bg-elevated shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-3.5 h-12">
          <Search size={16} className="text-ink-faint shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search folders, questions, answers, files…"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
          />
          <button onClick={() => setSearchOpen(false)} className="p-1 text-ink-faint hover:text-ink" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-1.5">
          {loading && <p className="px-4 py-3 text-sm text-ink-faint">Searching…</p>}

          {!loading && query.trim() && results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-ink-faint">No results for &ldquo;{query}&rdquo;.</p>
          )}

          {!loading &&
            results.map((hit, i) => (
              <button
                key={hit.node.id}
                onClick={() => openResult(hit)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === activeIndex ? "bg-accent/10" : ""
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <NodeIcon node={hit.node} size={15} className="shrink-0 text-accent" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ink">{hit.node.name}</span>
                    <span className="block truncate text-xs text-ink-faint">
                      {["My Notes", ...hit.path.map((p) => p.name)].join(" / ")}
                    </span>
                  </span>
                </span>
                {i === activeIndex && <CornerDownLeft size={14} className="shrink-0 text-ink-faint" />}
              </button>
            ))}

          {!query.trim() && <p className="px-4 py-6 text-center text-sm text-ink-faint">Start typing to search your whole tree.</p>}
        </div>
      </div>
    </div>
  );
}
