"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AppNode } from "@/types/node";
import { useData } from "@/lib/DataContext";
import NodeIcon from "./NodeIcon";
import { cn } from "@/lib/utils";

/**
 * Recursively renders the children of a folder (or the root, when
 * parentId is null). Folders can be expanded in place; content nodes
 * are direct links. This is the whole tree — there is no separate
 * "top level" component or logic.
 */
export default function TreeChildren({
  parentId,
  depth,
  onNavigate
}: {
  parentId: string | null;
  depth: number;
  onNavigate?: () => void;
}) {
  const data = useData();
  const [children, setChildren] = useState<AppNode[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    data.listChildren(parentId).then((c) => {
      if (!cancelled) setChildren(c);
    });
    return () => {
      cancelled = true;
    };
  }, [data, parentId, data.version]);

  if (children === null) return null;
  if (children.length === 0 && depth > 0) {
    return <p className="pl-3 py-1 text-xs text-ink-faint" style={{ paddingLeft: depth * 14 + 12 }}>Empty</p>;
  }

  return (
    <ul className="space-y-0.5">
      {children.map((node) =>
        node.type === "folder" ? (
          <TreeFolderRow key={node.id} node={node} depth={depth} onNavigate={onNavigate} />
        ) : (
          <TreeLeafRow key={node.id} node={node} depth={depth} onNavigate={onNavigate} />
        )
      )}
    </ul>
  );
}

function TreeFolderRow({ node, depth, onNavigate }: { node: AppNode; depth: number; onNavigate?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const active = pathname === `/f/${node.id}`;

  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-1 rounded-lg pr-2 py-1.5 text-sm transition-colors group",
          active ? "bg-accent/10 text-accent" : "text-ink-dim hover:text-ink hover:bg-bg-hover"
        )}
        style={{ paddingLeft: depth * 14 + 8 }}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 p-0.5 text-ink-faint hover:text-ink"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <ChevronRight size={13} className={cn("transition-transform", expanded && "rotate-90")} />
        </button>
        <Link href={`/f/${node.id}`} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2">
          <NodeIcon node={node} size={15} className="shrink-0" />
          <span className="truncate">{node.name}</span>
        </Link>
      </div>
      {expanded && <TreeChildren parentId={node.id} depth={depth + 1} onNavigate={onNavigate} />}
    </li>
  );
}

function TreeLeafRow({ node, depth, onNavigate }: { node: AppNode; depth: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === `/n/${node.id}`;

  return (
    <li>
      <Link
        href={`/n/${node.id}`}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 rounded-lg py-1.5 pr-2 text-sm transition-colors",
          active ? "bg-accent/10 text-accent" : "text-ink-dim hover:text-ink hover:bg-bg-hover"
        )}
        style={{ paddingLeft: depth * 14 + 26 }}
      >
        <NodeIcon node={node} size={14} className="shrink-0" />
        <span className="truncate">{node.name}</span>
      </Link>
    </li>
  );
}
