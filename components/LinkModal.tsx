"use client";

import { useState } from "react";
import Modal from "./Modal";
import { LinkInput } from "@/lib/DataContext";

export default function LinkModal({
  defaultValues,
  onSubmit,
  onClose
}: {
  defaultValues?: LinkInput;
  onSubmit: (values: LinkInput) => void | Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [url, setUrl] = useState(defaultValues?.url ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim() || !url.trim()) {
      setError("Name and URL are required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit({ name: name.trim(), url: url.trim(), description: description.trim() || undefined });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <Modal title={defaultValues ? "Edit link" : "Add link"} onClose={onClose}>
      <label className="block text-xs text-ink-faint mb-1.5">Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} className="input mb-3" placeholder="Useful website" />
      <label className="block text-xs text-ink-faint mb-1.5">URL</label>
      <input value={url} onChange={(e) => setUrl(e.target.value)} className="input mb-3" placeholder="https://…" />
      <label className="block text-xs text-ink-faint mb-1.5">Description (optional)</label>
      <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm text-ink-dim hover:bg-bg-hover">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </Modal>
  );
}
