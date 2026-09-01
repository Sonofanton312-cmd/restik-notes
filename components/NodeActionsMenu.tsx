"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, FolderInput, Trash2 } from "lucide-react";
import { AppNode } from "@/types/node";
import { useData } from "@/lib/DataContext";
import PromptModal from "./PromptModal";
import MoveModal from "./MoveModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

export default function NodeActionsMenu({
  node,
  onChanged,
  className = ""
}: {
  node: AppNode;
  onChanged: () => void;
  className?: string;
}) {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<"rename" | "move" | "delete" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div 
      ref={ref} 
      className={`relative ${className}`} 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-bg-hover transition-colors"
        aria-label="More actions"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div 
          className="absolute right-0 top-full mt-1 z-20 w-40 rounded-lg border border-border bg-bg-elevated py-1 shadow-lg"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setModal("rename");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-dim hover:bg-bg-hover"
          >
            <Pencil size={14} /> Rename
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setModal("move");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-dim hover:bg-bg-hover"
          >
            <FolderInput size={14} /> Move
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setModal("delete");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {modal === "rename" && (
        <PromptModal
          title="Rename"
          label="Name"
          defaultValue={node.name}
          submitLabel="Rename"
          onSubmit={async (value) => {
            await data.rename(node.id, value);
            onChanged();
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "move" && (
        <MoveModal 
          node={node} 
          onClose={() => setModal(null)} 
          onMoved={onChanged} 
        />
      )}
      {modal === "delete" && (
        <ConfirmDeleteModal 
          node={node} 
          onClose={() => setModal(null)} 
          onDeleted={onChanged} 
        />
      )}
    </div>
  );
}