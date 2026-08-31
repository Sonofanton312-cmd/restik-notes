"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

export default function Modal({
  title,
  onClose,
  children,
  maxWidth = "max-w-sm"
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button aria-label="Close" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidth} rounded-t-2xl sm:rounded-2xl border border-border bg-bg-elevated overflow-hidden`}
      >
        <div className="flex items-center justify-between px-4 h-12 border-b border-border">
          <p className="text-sm font-medium text-ink">{title}</p>
          <button onClick={onClose} className="p-1 text-ink-faint hover:text-ink" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
