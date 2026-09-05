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

      let targetFolderId: string | null = currentFolderId;

      // 1. Root Subject Folder
      if (payload.folderName) {
        setStatus(`Creating folder: ${payload.folderName}`);
        const parentFolder = await data.createFolder(targetFolderId, payload.folderName);
        targetFolderId = parentFolder.id;
      }

      // 2. Subfolders (Units)
      const subfolders = payload.subfolders || [];
      for (let i = 0; i < subfolders.length; i++) {
        const sf = subfolders[i];
        setStatus(`Creating unit: ${sf.name}`);
        const unitFolder = await data.createFolder(targetFolderId, sf.name);

        // 3. Questions inside the unit
        const questions = sf.questions || [];
        for (let j = 0; j < questions.length; j++) {
          const q = questions[j];
          const questionName = q.name || `Question ${j + 1}`;
          setStatus(`Adding ${questionName}`);

          // Matches QuestionInput expected by createQuestion(parentId, data)
          await data.createQuestion(unitFolder.id, {
            name: questionName,
            question: questionName,
            answer: q.answer || "",
            marks: q.marks ? Number(q.marks) : undefined,
            importance: q.importance || "None",
            tags: Array.isArray(q.tags) ? q.tags : [],
          });
        }
      }

      setStatus("Done!");
      onImported();
      setTimeout(onClose, 600);
    } catch (err: any) {
      setError(err.message || "Failed to import JSON.");
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
          Upload <code>cn-unit-01.json</code> to automatically populate your unit with all markdown answers.
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