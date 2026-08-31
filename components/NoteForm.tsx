"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppNode } from "@/types/node";
import { useData } from "@/lib/DataContext";
import Markdown from "./Markdown";
import { Eye, Pencil, Save, X } from "lucide-react";

export default function NoteForm({ parentId, existing }: { parentId?: string | null; existing?: AppNode }) {
  const data = useData();
  const router = useRouter();
  const existingContent = existing?.content as any;

  const [name, setName] = useState(existing?.name ?? "");
  const [body, setBody] = useState(existingContent?.body ?? "");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cancelHref = existing ? `/n/${existing.id}` : parentId ? `/f/${parentId}` : "/f/root";

  async function handleSave() {
    setError("");
    if (!name.trim() || !body.trim()) {
      setError("Title and content are required.");
      return;
    }
    setSaving(true);
    try {
      if (existing) {
        await data.updateNote(existing.id, { name: name.trim(), body });
        router.push(`/n/${existing.id}`);
      } else {
        const node = await data.createNote(parentId ?? null, { name: name.trim(), body });
        router.push(`/n/${node.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong saving this note.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink font-mono">{existing ? "Edit note" : "New note"}</h1>
        <Link href={cancelHref} className="text-ink-faint hover:text-ink">
          <X size={20} />
        </Link>
      </div>

      {!data.configured && (
        <div className="mb-5 rounded-xl border border-accent-2/40 bg-accent-2/10 p-4 text-sm text-ink-dim">
          You&apos;re in local demo mode — this note will only exist for this browser session. Connect Supabase
          (see README) to save it permanently.
        </div>
      )}

      <label className="block mb-3">
        <span className="mb-1.5 block text-xs text-ink-faint">Title</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="GATE Formula Sheet" />
      </label>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-ink-faint">Content (Markdown)</label>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <button
              onClick={() => setMode("write")}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${mode === "write" ? "bg-accent/15 text-accent" : "text-ink-faint"}`}
            >
              <Pencil size={12} /> Write
            </button>
            <button
              onClick={() => setMode("preview")}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${mode === "preview" ? "bg-accent/15 text-accent" : "text-ink-faint"}`}
            >
              <Eye size={12} /> Preview
            </button>
          </div>
        </div>

        {mode === "write" ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={18}
            className="input font-mono text-sm resize-y"
            placeholder={"## Heading\n\nWrite freeform notes in Markdown."}
          />
        ) : (
          <div className="rounded-lg border border-border bg-bg-elevated p-4 max-h-[440px] overflow-y-auto">
            {body.trim() ? <Markdown content={body} /> : <p className="text-sm text-ink-faint">Nothing to preview yet.</p>}
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Save size={15} /> {saving ? "Saving…" : "Save"}
        </button>
        <Link href={cancelHref} className="rounded-lg border border-border px-4 py-2.5 text-sm text-ink-dim hover:bg-bg-hover">
          Cancel
        </Link>
      </div>
    </div>
  );
}
