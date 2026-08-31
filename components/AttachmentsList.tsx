"use client";

import { useRef, useState } from "react";
import { Paperclip, Upload, X, Download } from "lucide-react";
import { AppNode } from "@/types/node";
import { useData } from "@/lib/DataContext";
import { formatBytes } from "@/lib/utils";

export default function AttachmentsList({ node, onChanged }: { node: AppNode; onChanged: () => void }) {
  const data = useData();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachments = node.metadata.attachments ?? [];

  async function handleUpload(file: File) {
    setError("");
    setBusy(true);
    try {
      await data.addAttachment(node.id, file);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add that attachment.");
    } finally {
      setBusy(false);
    }
  }

  async function handleOpen(storagePath: string) {
    try {
      const url = await data.getFileUrl(storagePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open that file.");
    }
  }

  async function handleRemove(attachmentId: string) {
    setBusy(true);
    try {
      await data.removeAttachment(node.id, attachmentId);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove that attachment.");
    } finally {
      setBusy(false);
    }
  }

  if (attachments.length === 0 && !data.configured) return null;

  return (
    <div className="mt-8 rounded-xl border border-border bg-bg-elevated p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-ink-faint">
          <Paperclip size={13} /> Attachments
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-1.5 text-xs text-accent hover:underline disabled:opacity-50"
        >
          <Upload size={12} /> Add file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) handleUpload(file);
          }}
        />
      </div>

      {attachments.length === 0 ? (
        <p className="text-xs text-ink-faint">No attachments yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <Paperclip size={13} className="text-ink-faint shrink-0" />
              <button
                onClick={() => handleOpen(a.storagePath)}
                className="min-w-0 flex-1 text-left text-xs text-ink hover:text-accent truncate"
              >
                {a.fileName}
              </button>
              <span className="text-[11px] text-ink-faint shrink-0">{formatBytes(a.fileSize)}</span>
              <button
                onClick={() => handleOpen(a.storagePath)}
                className="p-1 text-ink-faint hover:text-accent shrink-0"
                aria-label="Download"
              >
                <Download size={13} />
              </button>
              <button
                onClick={() => handleRemove(a.id)}
                className="p-1 text-ink-faint hover:text-red-500 shrink-0"
                aria-label="Remove"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
