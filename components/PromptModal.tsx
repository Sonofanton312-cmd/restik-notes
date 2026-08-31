"use client";

import { useState } from "react";
import Modal from "./Modal";

export default function PromptModal({
  title,
  label,
  defaultValue = "",
  submitLabel = "Save",
  placeholder,
  onSubmit,
  onClose
}: {
  title: string;
  label: string;
  defaultValue?: string;
  submitLabel?: string;
  placeholder?: string;
  onSubmit: (value: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!value.trim()) {
      setError("This can't be empty.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit(value.trim());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <label className="block text-xs text-ink-faint mb-1.5">{label}</label>
      <input
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="input"
      />
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
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </Modal>
  );
}
