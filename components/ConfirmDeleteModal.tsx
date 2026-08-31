"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useData } from "@/lib/DataContext";
import { AppNode } from "@/types/node";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDeleteModal({
  node,
  onClose,
  onDeleted
}: {
  node: AppNode;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const data = useData();
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (node.type === "folder") {
      data.countDescendants(node.id).then(setCount);
    }
  }, [data, node]);

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await data.softDelete(node.id);
      onDeleted();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete this item.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Move to trash?" onClose={onClose}>
      <div className="flex gap-3">
        <AlertTriangle size={18} className="shrink-0 text-accent-2 mt-0.5" />
        <p className="text-sm text-ink-dim">
          {node.type === "folder" ? (
            <>
              <span className="text-ink font-medium">{node.name}</span>
              {count !== null && count > 0 && (
                <> contains {count} item{count === 1 ? "" : "s"}.</>
              )}{" "}
              Everything inside will move to trash too. You can restore it later.
            </>
          ) : (
            <>
              <span className="text-ink font-medium">{node.name}</span> will move to trash. You can restore it
              later.
            </>
          )}
        </p>
      </div>
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm text-ink-dim hover:bg-bg-hover">
          Cancel
        </button>
        <button
          onClick={confirm}
          disabled={busy}
          className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Moving…" : "Move to trash"}
        </button>
      </div>
    </Modal>
  );
}
