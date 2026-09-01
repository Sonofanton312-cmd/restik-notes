"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppNode } from "@/types/node";
import { useData } from "@/lib/DataContext";
import { ChevronLeft, ChevronRight, ListOrdered, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuestionQuickJump({ currentNode }: { currentNode: AppNode }) {
  const data = useData();
  const router = useRouter();
  const [questions, setQuestions] = useState<AppNode[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadQuestions() {
      if (!currentNode.parentId) return;

      const siblings = await data.listChildren(currentNode.parentId);
      
      const naturalSort = (a: AppNode, b: AppNode) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });

      const sorted = (siblings ?? [])
        .filter((n) => n.type === "question")
        .sort(naturalSort);

      setQuestions(sorted);
    }

    loadQuestions();
  }, [data, currentNode]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (questions.length <= 1) return null;

  const currentIndex = questions.findIndex((q) => q.id === currentNode.id);
  const prevQuestion = currentIndex > 0 ? questions[currentIndex - 1] : null;
  const nextQuestion = currentIndex < questions.length - 1 ? questions[currentIndex + 1] : null;

  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-bg-elevated/90 px-3 py-2 shadow-sm">
      {/* Previous Button */}
      <button
        type="button"
        disabled={!prevQuestion}
        onClick={() => prevQuestion && router.push(`/n/${prevQuestion.id}`)}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-dim hover:bg-bg-hover hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Center Dropdown Pill Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-1.5 text-xs font-medium text-ink hover:border-accent/40 transition-colors"
        >
          <ListOrdered size={14} className="text-accent" />
          <span>
            Q{currentIndex !== -1 ? currentIndex + 1 : 1} of {questions.length}
          </span>
          <ChevronDown size={13} className={cn("text-ink-faint transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 z-50 max-h-72 w-72 overflow-y-auto rounded-xl border border-border bg-bg-elevated p-2 shadow-xl">
            {/* Quick-Jump Tiny Number Pills */}
            <div className="mb-2 flex flex-wrap gap-1 border-b border-border pb-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/n/${q.id}`);
                  }}
                  className={cn(
                    "h-6 min-w-[28px] px-1.5 rounded text-[11px] font-mono transition-colors",
                    q.id === currentNode.id
                      ? "bg-accent text-bg font-bold"
                      : "bg-bg text-ink-dim hover:bg-bg-hover hover:text-ink"
                  )}
                >
                  Q{idx + 1}
                </button>
              ))}
            </div>

            {/* Title List View */}
            <div className="space-y-0.5">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/n/${q.id}`);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                    q.id === currentNode.id
                      ? "bg-accent/15 text-accent font-medium"
                      : "text-ink-dim hover:bg-bg-hover hover:text-ink"
                  )}
                >
                  <span className="font-mono text-[10px] text-ink-faint shrink-0">
                    Q{idx + 1}
                  </span>
                  <span className="truncate flex-1">{q.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Next Button */}
      <button
        type="button"
        disabled={!nextQuestion}
        onClick={() => nextQuestion && router.push(`/n/${nextQuestion.id}`)}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-dim hover:bg-bg-hover hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}