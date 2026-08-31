"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SearchHit } from "@/types/node";
import { useData } from "@/lib/DataContext";
import NodeIcon from "@/components/NodeIcon";

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}

function SearchResults() {
  const data = useData();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [results, setResults] = useState<SearchHit[]>([]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    data.searchNodes(q).then(setResults);
  }, [data, q]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="text-xl sm:text-2xl font-semibold text-ink font-mono">Search</h1>
      <p className="mt-1 text-sm text-ink-faint">
        {q.trim() ? (
          <>
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
          </>
        ) : (
          "Use the search bar (Ctrl+K) or add ?q=your+query to this URL."
        )}
      </p>

      {results.length > 0 && (
        <div className="mt-6 rounded-xl border border-border divide-y divide-border overflow-hidden">
          {results.map(({ node, path }) => (
            <Link key={node.id} href={`/n/${node.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors">
              <NodeIcon node={node} size={16} className="text-accent shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{node.name}</span>
                <span className="block truncate text-xs text-ink-faint">
                  {["My Notes", ...path.map((p) => p.name)].join(" / ")}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
