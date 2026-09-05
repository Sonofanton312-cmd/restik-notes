"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderPlus, HelpCircle, FileText, Upload, Link2, FileUp } from "lucide-react";
import { useData } from "@/lib/DataContext";
import PromptModal from "./PromptModal";
import LinkModal from "./LinkModal";
import BatchImportModal from "./BatchImportModal";

/**
 * The single "+ New" control used at every level of the tree — root,
 * a folder ten levels deep, all identical. Nothing here special-cases
 * "top level"; it just passes whatever parentId it was given.
 */
export default function NewMenu({
  parentId,
  onCreated,
  compact = false
}: {
  parentId: string | null;
  onCreated: (newId?: string) => void;
  compact?: boolean;
}) {
  const data = useData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<"folder" | "link" | "batch" | null>(null);
  const [uploadError, setUploadError] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const parentParam = parentId ?? "root";

  async function handleUpload(file: File) {
    setUploadError("");
    try {
      const node = await data.uploadFile(parentId, file);
      onCreated(node.id);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          compact
            ? "flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-ink-dim hover:text-ink hover:bg-bg-hover transition-colors"
            : "flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
        }
      >
        <Plus size={compact ? 13 : 15} /> New
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-52 rounded-lg border border-border bg-bg-elevated py-1 shadow-lg">
          <button
            onClick={() => {
              setModal("folder");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink-dim hover:bg-bg-hover"
          >
            <FolderPlus size={15} /> Folder
          </button>
          <button
            onClick={() => {
              setOpen(false);
              router.push(`/new/question?parent=${parentParam}`);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink-dim hover:bg-bg-hover"
          >
            <HelpCircle size={15} /> Question
          </button>
          <button
            onClick={() => {
              setOpen(false);
              router.push(`/new/note?parent=${parentParam}`);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink-dim hover:bg-bg-hover"
          >
            <FileText size={15} /> Note
          </button>
          <button
            onClick={() => {
              setModal("batch");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-accent hover:bg-bg-hover font-medium border-y border-border my-1 py-2"
          >
            <FileUp size={15} /> Import JSON Batch
          </button>
          <button
            onClick={() => {
              setOpen(false);
              fileInputRef.current?.click();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink-dim hover:bg-bg-hover"
          >
            <Upload size={15} /> Upload file
          </button>
          <button
            onClick={() => {
              setModal("link");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink-dim hover:bg-bg-hover"
          >
            <Link2 size={15} /> Add link
          </button>
        </div>
      )}

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

      {uploadError && (
        <div className="absolute left-0 top-full mt-1 z-20 w-64 rounded-lg border border-red-500/30 bg-bg-elevated p-3 text-xs text-red-500 shadow-lg">
          {uploadError}
        </div>
      )}

      {modal === "folder" && (
        <PromptModal
          title="New folder"
          label="Folder name"
          submitLabel="Create"
          placeholder="e.g. Unit 1"
          onSubmit={async (name) => {
            const node = await data.createFolder(parentId, name);
            onCreated(node.id);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "link" && (
        <LinkModal
          onSubmit={async (values) => {
            const node = await data.createLink(parentId, values);
            onCreated(node.id);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "batch" && (
        <BatchImportModal
          currentFolderId={parentId}
          isOpen={true}
          onClose={() => setModal(null)}
          onImported={() => onCreated()}
        />
      )}
    </div>
  );
}