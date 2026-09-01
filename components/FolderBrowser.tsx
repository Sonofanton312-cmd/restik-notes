"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNode, NodePath } from "@/types/node";
import { useData } from "@/lib/DataContext";
import Breadcrumbs from "./Breadcrumbs";
import NewMenu from "./NewMenu";
import NodeIcon from "./NodeIcon";
import NodeActionsMenu from "./NodeActionsMenu";
import { formatBytes, formatDate } from "@/lib/utils";
import { LayoutGrid, List as ListIcon, Star } from "lucide-react";
import { cn } from "@/lib/utils";

function summaryFor(node: AppNode): string {
  if (node.type === "folder") return "Folder";
  if (node.type === "question") return `Question · ${node.metadata.marks ?? "—"} marks`;
  if (node.type === "note") return "Note";
  if (node.type === "link") return "Link";
  if (node.type === "file") return formatBytes((node.content as any).fileSize ?? 0);
  return "";
}

export default function FolderBrowser({ folderId }: { folderId: string | null }) {
  const data = useData();
  const [folder, setFolder] = useState<AppNode | null>(null);
  const [path, setPath] = useState<NodePath>([]);
  const [children, setChildren] = useState<AppNode[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [view, setView] = useState<"grid" | "list">("list");

  useEffect(() => {
    const stored = localStorage.getItem("restik-notes-view");
    if (stored === "grid" || stored === "list") setView(stored);
  }, []);

  function setViewAndRemember(v: "grid" | "list") {
    setView(v);
    localStorage.setItem("restik-notes-view", v);
  }

  useEffect(() => {
    let cancelled = false;
    setNotFound(false);

    async function load() {
      if (folderId === null) {
        setFolder(null);
        setPath([]);
      } else {
        const node = await data.getNode(folderId);
        if (!node || node.type !== "folder") {
          if (!cancelled) setNotFound(true);
          return;
        }
        const p = await data.getPath(folderId);
        if (!cancelled) {
          setFolder(node);
          setPath(p.slice(0, -1));
        }
      }
      const kids = await data.listChildren(folderId);
      if (!cancelled) setChildren(kids);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [data, folderId, data.version]);

  function refresh() {
    data.listChildren(folderId).then(setChildren);
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-ink-faint">This folder doesn&apos;t exist, or was moved to trash.</p>
        <Link href="/f/root" className="mt-4 inline-block rounded-lg border border-border px-4 py-2 text-sm text-ink-dim hover:bg-bg-hover">
          Back to My Notes
        </Link>
      </div>
    );
  }

  const naturalSort = (a: AppNode, b: AppNode) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });

  const folders = (children ?? [])
    .filter((n) => n.type === "folder")
    .sort(naturalSort);

  const content = (children ?? [])
    .filter((n) => n.type !== "folder")
    .sort(naturalSort);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
      {folderId !== null && <Breadcrumbs path={path} />}

      <div className="flex items-start justify-between gap-3 mt-1 mb-5">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-ink font-mono truncate">
            {folder ? folder.name : "My Notes"}
          </h1>
          {children && (
            <p className="mt-1 text-xs text-ink-faint">
              {children.length} item{children.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center rounded-lg border border-border p-0.5">
            <button
              onClick={() => setViewAndRemember("list")}
              className={cn("p-1.5 rounded-md", view === "list" ? "bg-accent/15 text-accent" : "text-ink-faint")}
              aria-label="List view"
            >
              <ListIcon size={14} />
            </button>
            <button
              onClick={() => setViewAndRemember("grid")}
              className={cn("p-1.5 rounded-md", view === "grid" ? "bg-accent/15 text-accent" : "text-ink-faint")}
              aria-label="Grid view"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
          <NewMenu parentId={folderId} onCreated={refresh} />
        </div>
      </div>

      {children && children.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-14 text-center">
          <p className="text-sm text-ink-faint">Nothing here yet.</p>
          <p className="mt-1 text-xs text-ink-faint">Use + New to add a folder, question, note, file, or link.</p>
        </div>
      )}

      {folders.length > 0 && (
        <Section title="Folders" nodes={folders} view={view} onChanged={refresh} />
      )}
      {content.length > 0 && (
        <Section title="Content" nodes={content} view={view} onChanged={refresh} className={folders.length > 0 ? "mt-6" : ""} />
      )}
    </div>
  );
}

function Section({
  title,
  nodes,
  view,
  onChanged,
  className = ""
}: {
  title: string;
  nodes: AppNode[];
  view: "grid" | "list";
  onChanged: () => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-2 text-[11px] font-mono uppercase tracking-wider text-ink-faint">{title}</p>
      {view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {nodes.map((n) => (
            <NodeCardGrid key={n.id} node={n} onChanged={onChanged} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
          {nodes.map((n) => (
            <NodeRowList key={n.id} node={n} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}

function NodeCardGrid({ node, onChanged }: { node: AppNode; onChanged: () => void }) {
  const href = node.type === "folder" ? `/f/${node.id}` : `/n/${node.id}`;
  return (
    <div className="group relative rounded-xl border border-border bg-bg-elevated hover:border-accent/40 hover:bg-bg-hover transition-colors">
      <Link
        href={href}
        className="flex flex-col gap-2 p-4 h-full"
      >
        <div className="flex items-start justify-between pr-6">
          <NodeIcon node={node} size={20} className="text-accent" />
          {node.metadata.importance === "High" && <Star size={13} className="fill-accent-2 text-accent-2" />}
        </div>
        <p className="text-sm text-ink font-medium truncate">{node.name}</p>
        <p className="text-xs text-ink-faint">{summaryFor(node)}</p>
      </Link>
      <div 
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <NodeActionsMenu node={node} onChanged={onChanged} />
      </div>
    </div>
  );
}

function NodeRowList({ node, onChanged }: { node: AppNode; onChanged: () => void }) {
  const href = node.type === "folder" ? `/f/${node.id}` : `/n/${node.id}`;
  return (
    <div className="group flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors">
      <Link href={href} className="flex items-center gap-3 min-w-0 flex-1">
        <NodeIcon node={node} size={17} className="text-accent shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm text-ink">{node.name}</span>
            {node.metadata.importance === "High" && <Star size={12} className="shrink-0 fill-accent-2 text-accent-2" />}
          </span>
          <span className="block text-xs text-ink-faint">{summaryFor(node)}</span>
        </span>
      </Link>
      <div className="flex items-center gap-3 shrink-0 ml-2">
        <span className="hidden sm:block text-xs text-ink-faint">{formatDate(node.updatedAt)}</span>
        <div 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <NodeActionsMenu node={node} onChanged={onChanged} />
        </div>
      </div>
    </div>
  );
}