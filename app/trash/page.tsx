"use client";

import { useEffect, useState } from "react";
import { AppNode } from "@/types/node";
import { useData } from "@/lib/DataContext";
import NodeIcon from "@/components/NodeIcon";
import { formatDate } from "@/lib/utils";
import { RotateCcw, Trash2 } from "lucide-react";

export default function TrashPage() {
  const data = useData();
  const [all, setAll] = useState<AppNode[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    data.listTrash().then(setAll);
  }, [data, data.version]);

  // Only show the "top" of each deleted subtree — a node whose parent
  // isn't also in the trash — so deleting a folder shows one row, not
  // fifty rows for everything that was inside it.
  const deletedIds = new Set((all ?? []).map((n) => n.id));
  const roots = (all ?? []).filter((n) => !n.parentId || !deletedIds.has(n.parentId));

  async function restore(id: string) {
    setBusyId(id);
    await data.restore(id);
    setBusyId(null);
  }

  async function destroy(id: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This can't be undone.`)) return;
    setBusyId(id);
    await data.permanentDelete(id);
    setBusyId(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="text-xl sm:text-2xl font-semibold text-ink font-mono">Trash</h1>
      <p className="mt-1 text-sm text-ink-faint">Deleted items stay here until you restore or permanently delete them.</p>

      {roots.length === 0 && <p className="mt-8 text-sm text-ink-faint">Trash is empty.</p>}

      <div className="mt-6 rounded-xl border border-border divide-y divide-border overflow-hidden">
        {roots.map((node) => (
          <div key={node.id} className="flex items-center gap-3 px-4 py-3">
            <NodeIcon node={node} size={16} className="text-ink-faint shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-ink">{node.name}</span>
              <span className="block truncate text-xs text-ink-faint">deleted {formatDate(node.deletedAt ?? node.updatedAt)}</span>
            </span>
            <button
              onClick={() => restore(node.id)}
              disabled={busyId === node.id}
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-ink-dim hover:bg-bg-hover disabled:opacity-50"
            >
              <RotateCcw size={12} /> Restore
            </button>
            <button
              onClick={() => destroy(node.id, node.name)}
              disabled={busyId === node.id}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 size={12} /> Delete forever
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
