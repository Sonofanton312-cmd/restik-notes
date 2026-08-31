"use client";

import { Menu, Search, BookOpenText } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useUI } from "./UIContext";

export default function Header() {
  const { setDrawerOpen, setSearchOpen, readingMode, toggleReadingMode } = useUI();

  if (readingMode) {
    return (
      <header className="sticky top-0 z-30 flex items-center justify-between h-12 px-4 border-b border-border bg-bg/90 backdrop-blur">
        <button
          onClick={toggleReadingMode}
          className="text-xs font-mono text-ink-faint hover:text-ink transition-colors"
        >
          exit reading mode
        </button>
        <ThemeToggle compact />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 h-14 px-3 md:px-4 border-b border-border bg-bg-elevated/90 backdrop-blur">
      <button
        onClick={() => setDrawerOpen(true)}
        className="md:hidden p-2 -ml-1 text-ink-dim active:bg-bg-hover rounded-lg"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <button
        onClick={() => setSearchOpen(true)}
        className="flex flex-1 md:flex-none md:w-72 items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink-faint hover:border-accent/40 transition-colors"
      >
        <Search size={15} />
        <span className="flex-1 text-left">Search notes…</span>
        <kbd className="hidden md:inline-block rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-ink-faint">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleReadingMode}
          title="Reading mode"
          className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-ink-dim hover:text-ink hover:bg-bg-hover transition-colors"
        >
          <BookOpenText size={15} />
          <span>Reading mode</span>
        </button>
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
