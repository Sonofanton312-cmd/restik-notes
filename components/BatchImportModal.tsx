"use client";

import { useState, useRef } from "react";
import { FileCode, AlertCircle, Loader2 } from "lucide-react";
import { useData } from "@/lib/DataContext";
import Modal from "./Modal";

interface BatchImportModalProps {
  currentFolderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function BatchImportModal({
  currentFolderId,
  isOpen,
  onClose,
  onImported,
}: BatchImportModalProps) {
  const data = useData();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  async function processImport(jsonContent: string) {
    try {
      setLoading(true);
      setError("");
      const payload = JSON.parse(jsonContent);

      let targetFolderId: string | undefined = currentFolderId ?? undefined;

      // 1. Create root folder if present in JSON
      if (payload.folderName) {
        setStatus(`Creating folder: ${payload.folderName}`);
        const parentFolder = await (data as any).createFolder(targetFolderId ?? null, payload.folderName);
        targetFolderId = parentFolder?.id ?? targetFolderId;
      }

      // Helper function to safely call createQuestion regardless of parameter style
      async function insertQuestion(folderId: string | undefined, q: any, fallbackIdx: number) {
        const title = (q.name || q.question || q.title || `Question ${fallbackIdx + 1}`).trim();
        const questionText = q.question || q.name || title;
        const answerText = q.answer || q.body || "";

        const metadata = {
          marks: q.marks !== undefined && q.marks !== null ? Number(q.marks) : null,
          importance: q.importance || "None",
          tags: Array.isArray(q.tags) ? q.tags : [],
        };

        const content = {
          question: questionText,
          answer: answerText,
        };

        // Try (parentId, name, { metadata, content }) first
        try {
          await (data as any).createQuestion(folderId ?? null, title, { metadata, content });
        } catch {
          // Fallback to (parentId, { name, metadata, content })
          await (data as any).createQuestion(folderId ?? null, {
            name: title,
            metadata,
            content,
          });
        }
      }

      // 2. Process subfolders
      const subfolders = payload.subfolders || [];
      for (let i = 0; i < subfolders.length; i++) {
        const sf = subfolders[i];
        const subfolderName = sf.name || `Unit ${i + 1}`;
        setStatus(`Creating subfolder: ${subfolderName}`);
        
        const createdSubfolder = await (data as any).createFolder(targetFolderId ?? null, subfolderName);
        const activeSubfolderId = createdSubfolder?.id ?? targetFolderId;

        const questions = sf.questions || [];
        for (let j = 0; j < questions.length; j++) {
          const q = questions[j];
          setStatus(`Creating [${subfolderName}] Q${j + 1}...`);
          await insertQuestion(activeSubfolderId, q, j);
        }
      }

      // 3. Process direct root-level questions
      if (payload.questions && Array.isArray(payload.questions)) {
        for (let k = 0; k < payload.questions.length; k++) {
          const q = payload.questions[k];
          setStatus(`Adding Q${k + 1}...`);
          await insertQuestion(targetFolderId, q, k);
        }
      }

      setStatus("Done!");
      onImported();
      setTimeout(onClose, 800);
    } catch (err: any) {
      setError(err.message || "Failed to parse or upload JSON format.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) processImport(content);
    };
    reader.readAsText(file);
  }

  return (
    <Modal title="Batch Import Notes" onClose={onClose}>
      <div className="p-5">
        <p className="text-xs text-ink-dim mb-4">
          Upload a <code>.json</code> file to recursively build units and questions automatically.
        </p>

        <input
          type="file"
          ref={fileInputRef}
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onClick={() => !loading && fileInputRef.current?.click()}
          className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-accent/60 bg-bg-hover/30 p-8 cursor-pointer transition-colors"
        >
          {loading ? (
            <>
              <Loader2 size={32} className="animate-spin text-accent mb-2" />
              <p className="text-xs font-medium text-ink">{status}</p>
            </>
          ) : (
            <>
              <FileCode size={32} className="text-accent mb-2 group-hover:scale-105 transition-transform" />
              <p className="text-sm font-medium text-ink">Click to upload .json file</p>
              <p className="text-xs text-ink-faint mt-1">Hierarchical tree structure supported</p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-500">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}