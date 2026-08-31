"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useData } from "@/lib/DataContext";
import { AppNode, NodePath } from "@/types/node";
import { Folder, FolderTree } from "lucide-react";

export default function MoveModal({
  node,
  onClose,
  onMoved
}: {
  node: AppNode;
  onClose: () => void;
  onMoved: () => void;
}) {
  const data = useData();
  const [folders, setFolders] = useState<{ node: AppNode; path: NodePath }[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    data.listAllFolders().then(setFolders);
  }, [data]);

  async function moveTo(newParentId: string | null) {
    setBusy(true);
    setError("");
    try {
      await data.move(node.id, newParentId);
      onMoved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't move this item.");
      setBusy(false);
    }
  }

  const q = query.trim().toLowerCase();
  const filtered = folders.filter(
    (f) => f.node.id !== node.id && (!q || f.node.name.toLowerCase().includes(q))
  );

  return (
    <Modal title={`Move "${node.name}"`} onClose={onClose} maxWidth="max-w-md">
      <input
        autoFocus
        placeholder="Search folders…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="input mb-3"
      />

      <button
        onClick={() => moveTo(null)}
        disabled={busy || node.parentId === null}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-ink-dim hover:bg-bg-hover disabled:opacity-40 mb-1"
      >
        <FolderTree size={15} className="text-accent" />
        My Notes (top level)
      </button>

      <div className="max-h-64 overflow-y-auto">
        {filtered.length === 0 && <p className="px-3 py-4 text-sm text-ink-faint">No matching folders.</p>}
        {filtered.map(({ node: f, path }) => (
          <button
            key={f.id}
            onClick={() => moveTo(f.id)}
            disabled={busy || f.id === node.parentId}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-ink-dim hover:bg-bg-hover disabled:opacity-40"
          >
            <Folder size={15} className="text-accent shrink-0" />
            <span className="min-w-0">
              <span className="block truncate text-ink">{f.name}</span>
              <span className="block truncate text-xs text-ink-faint">
                {path
                  .slice(0, -1)
                  .map((p) => p.name)
                  .join(" / ") || "My Notes"}
              </span>
            </span>
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
    </Modal>
  );
}
