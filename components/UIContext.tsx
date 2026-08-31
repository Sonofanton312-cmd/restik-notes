"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  readingMode: boolean;
  toggleReadingMode: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const UIContext = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Global Ctrl+K / Cmd+K shortcut for search.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value: UIState = {
    sidebarCollapsed,
    toggleSidebar: () => setSidebarCollapsed((v) => !v),
    drawerOpen,
    setDrawerOpen,
    readingMode,
    toggleReadingMode: () => setReadingMode((v) => !v),
    searchOpen,
    setSearchOpen
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within a UIProvider");
  return ctx;
}
