"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNode, NodePath } from "@/types/node";
import { useData } from "@/lib/DataContext";
import NodeIcon from "@/components/NodeIcon";
import { formatDate } from "@/lib/utils";

export default function RecentPage() {
  const data = useData();
  const [items, setItems] = useState<{ node: AppNode; path: NodePath }[] | null>(null);

  useEffect(() => {
    data.listRecent(50).then(setItems);
  }, [data, data.version]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="text-xl sm:text-2xl font-semibold text-ink font-mono">Recent</h1>
      <p className="mt-1 text-sm text-ink-faint">Your most recently updated questions, notes, files, and links.</p>

      {items && items.length === 0 && <p className="mt-8 text-sm text-ink-faint">Nothing here yet.</p>}

      <div className="mt-6 rounded-xl border border-border divide-y divide-border overflow-hidden">
        {items?.map(({ node, path }) => (
          <Link key={node.id} href={`/n/${node.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors">
            <NodeIcon node={node} size={16} className="text-accent shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-ink">{node.name}</span>
              <span className="block truncate text-xs text-ink-faint">
                {["My Notes", ...path.map((p) => p.name)].join(" / ")}
              </span>
            </span>
            <span className="hidden sm:block shrink-0 text-xs text-ink-faint">{formatDate(node.updatedAt)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
