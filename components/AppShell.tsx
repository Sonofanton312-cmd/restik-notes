"use client";

import { ReactNode } from "react";
import { UIProvider, useUI } from "./UIContext";
import { DataProvider } from "@/lib/DataContext";
import Sidebar from "./Sidebar";
import MobileDrawer from "./MobileDrawer";
import Header from "./Header";
import SearchPalette from "./SearchPalette";

function ShellInner({ children }: { children: ReactNode }) {
  const { readingMode } = useUI();

  return (
    <div className="flex min-h-screen">
      {!readingMode && <Sidebar />}
      {!readingMode && <MobileDrawer />}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <SearchPalette />
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <UIProvider>
        <ShellInner>{children}</ShellInner>
      </UIProvider>
    </DataProvider>
  );
}
