"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNode, NodePath } from "@/types/node";
import { useData } from "@/lib/DataContext";
import NodeIcon from "@/components/NodeIcon";
import NewMenu from "@/components/NewMenu";
import SearchTriggerButton from "@/components/SearchTriggerButton";
import { formatDate } from "@/lib/utils";
import { Folder as FolderIcon, ArrowRight } from "lucide-react";

export default function HomePage() {
  const data = useData();
  const [recent, setRecent] = useState<{ node: AppNode; path: NodePath }[]>([]);
  const [topLevel, setTopLevel] = useState<AppNode[]>([]);

  useEffect(() => {
    data.listRecent(6).then(setRecent);
    data.listChildren(null).then((children) => setTopLevel(children.filter((n) => n.type === "folder")));
  }, [data, data.version]);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
      <div className="text-center mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">restik // notes</p>
        <h1 className="text-2xl sm:text-4xl font-semibold text-ink tracking-tight">What do you want to study?</h1>
        <p className="mt-2 text-sm text-ink-faint">
          Organize your notes however you want — no fixed subjects or folders.
        </p>
      </div>

      <SearchTriggerButton />

      <div className="mt-6 flex justify-center">
        <NewMenu parentId={null} onCreated={() => {}} />
      </div>

      {topLevel.length > 0 && (
        <div className="mt-12">
          <p className="mb-3 text-sm font-mono uppercase tracking-wider text-ink-dim">My Notes</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {topLevel.map((f) => (
              <Link
                key={f.id}
                href={`/f/${f.id}`}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-elevated p-4 hover:border-accent/40 hover:bg-bg-hover transition-colors"
              >
                <FolderIcon size={17} className="text-accent shrink-0" />
                <span className="truncate text-sm text-ink font-medium">{f.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-mono uppercase tracking-wider text-ink-dim">Recent</h2>
          <Link href="/recent" className="flex items-center gap-1 text-xs text-accent hover:underline">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-faint">Nothing yet — use + New to add your first question or note.</p>
        ) : (
          <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {recent.map(({ node, path }) => (
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
        )}
      </div>
    </div>
  );
}
