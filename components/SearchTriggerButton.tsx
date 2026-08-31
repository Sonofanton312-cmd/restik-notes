"use client";

import { Search } from "lucide-react";
import { useUI } from "./UIContext";

export default function SearchTriggerButton() {
  const { setSearchOpen } = useUI();
  return (
    <button
      onClick={() => setSearchOpen(true)}
      className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-full border border-border bg-bg-elevated px-4 py-3 text-sm text-ink-faint shadow-sm hover:border-accent/40 transition-colors"
    >
      <Search size={16} />
      <span>Search your notes — try &ldquo;flag register&rdquo; or &ldquo;interrupt&rdquo;</span>
    </button>
  );
}
