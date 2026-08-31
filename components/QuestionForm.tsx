"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppNode, Importance } from "@/types/node";
import { useData } from "@/lib/DataContext";
import Markdown from "./Markdown";
import { Eye, Pencil, Save, X } from "lucide-react";

const importanceOptions: Importance[] = ["None", "Low", "Medium", "High"];

export default function QuestionForm({
  parentId,
  existing
}: {
  parentId?: string | null;
  existing?: AppNode;
}) {
  const data = useData();
  const router = useRouter();

  const existingContent = existing?.content as any;

  const [name, setName] = useState(existing?.name ?? "");
  const [question, setQuestion] = useState(existingContent?.question ?? "");
  const [answer, setAnswer] = useState(existingContent?.answer ?? "");
  const [marks, setMarks] = useState<string>(existing?.metadata.marks?.toString() ?? "");
  const [tags, setTags] = useState(existing?.metadata.tags?.join(", ") ?? "");
  const [importance, setImportance] = useState<Importance>(existing?.metadata.importance ?? "None");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cancelHref = existing ? `/n/${existing.id}` : parentId ? `/f/${parentId}` : "/f/root";

  async function handleSave() {
    setError("");
    if (!name.trim() || !question.trim() || !answer.trim()) {
      setError("Title, question, and answer are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        question: question.trim(),
        answer,
        marks: marks.trim() ? Number(marks) : undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        importance
      };
      if (existing) {
        await data.updateQuestion(existing.id, payload);
        router.push(`/n/${existing.id}`);
      } else {
        const node = await data.createQuestion(parentId ?? null, payload);
        router.push(`/n/${node.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong saving this question.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink font-mono">{existing ? "Edit question" : "New question"}</h1>
        <Link href={cancelHref} className="text-ink-faint hover:text-ink">
          <X size={20} />
        </Link>
      </div>

      {!data.configured && (
        <div className="mb-5 rounded-xl border border-accent-2/40 bg-accent-2/10 p-4 text-sm text-ink-dim">
          You&apos;re in local demo mode — this question will only exist for this browser session. Connect
          Supabase (see README) to save it permanently.
        </div>
      )}

      <Field label="Title">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="Q3 — 8085 Flag Register"
        />
      </Field>

      <Field label="Question" className="mt-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          className="input resize-y"
          placeholder="Draw the format of the 8085 Flag Register and explain each flag."
        />
      </Field>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <Field label="Marks (optional)">
          <input
            type="number"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            className="input"
            placeholder="10"
          />
        </Field>
        <Field label="Importance">
          <select value={importance} onChange={(e) => setImportance(e.target.value as Importance)} className="input">
            {importanceOptions.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Tags (comma separated, optional)" className="mt-3">
        <input value={tags} onChange={(e) => setTags(e.target.value)} className="input" placeholder="8085, flags, important" />
      </Field>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-ink-faint">Answer (Markdown)</label>
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
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={18}
            className="input font-mono text-sm resize-y"
            placeholder={"## Heading\n\nPaste directly from Claude/ChatGPT — headings, tables, code blocks, and diagrams all render."}
          />
        ) : (
          <div className="rounded-lg border border-border bg-bg-elevated p-4 max-h-[440px] overflow-y-auto">
            {answer.trim() ? <Markdown content={answer} /> : <p className="text-sm text-ink-faint">Nothing to preview yet.</p>}
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

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs text-ink-faint">{label}</span>
      {children}
    </label>
  );
}
