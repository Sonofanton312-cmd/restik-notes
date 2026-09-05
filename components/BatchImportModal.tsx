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

      // Target folder ID (converted from string | null to string | undefined for DataContext compatibility)
      let targetFolderId: string | undefined = currentFolderId ?? undefined;

      // 1. Create root folder if defined in the JSON
      if (payload.folderName) {
        setStatus(`Creating folder: ${payload.folderName}`);
        const parentFolder = await (data as any).createFolder(payload.folderName, targetFolderId);
        targetFolderId = parentFolder.id;
      }

      // 2. Process subfolders
      const subfolders = payload.subfolders || [];
      for (let i = 0; i < subfolders.length; i++) {
        const sf = subfolders[i];
        setStatus(`Creating subfolder: ${sf.name}`);
        const createdSubfolder = await (data as any).createFolder(sf.name, targetFolderId);

        // 3. Process questions inside subfolder
        const questions = sf.questions || [];
        for (let j = 0; j < questions.length; j++) {
          const q = questions[j];
          setStatus(`Creating [${sf.name}] ${q.name || `Question ${j + 1}`}`);

          const questionPayload = {
            name: q.name,
            metadata: {
              marks: q.marks ?? null,
              importance: q.importance ?? "None",
              tags: q.tags ?? [],
            },
            content: {
              question: q.name,
              answer: q.answer || "",
            },
          };

          // Handles both 2-argument (parentId, data) and 1-argument object styles
          if ((data as any).createQuestion.length >= 2) {
            await (data as any).createQuestion(createdSubfolder.id, questionPayload);
          } else {
            await (data as any).createQuestion({
              parentId: createdSubfolder.id,
              ...questionPayload,
            });
          }
        }
      }

      // 4. Process direct questions if root level contains questions without subfolders
      if (payload.questions && Array.isArray(payload.questions)) {
        for (let k = 0; k < payload.questions.length; k++) {
          const q = payload.questions[k];
          setStatus(`Adding ${q.name}...`);

          const questionPayload = {
            name: q.name,
            metadata: {
              marks: q.marks ?? null,
              importance: q.importance ?? "None",
              tags: q.tags ?? [],
            },
            content: {
              question: q.name,
              answer: q.answer || "",
            },
          };

          if ((data as any).createQuestion.length >= 2) {
            await (data as any).createQuestion(targetFolderId, questionPayload);
          } else {
            await (data as any).createQuestion({
              parentId: targetFolderId,
              ...questionPayload,
            });
          }
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