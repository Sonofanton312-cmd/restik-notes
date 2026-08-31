"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Star, Clock, Trash2, Settings, User, ChevronsLeft, ChevronsRight, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUI } from "./UIContext";
import TreeChildren from "./TreeChildren";
import NewMenu from "./NewMenu";

const primaryNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/important", label: "Important", icon: Star },
  { href: "/recent", label: "Recent", icon: Clock },
  { href: "/trash", label: "Trash", icon: Trash2 }
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUI();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col shrink-0 border-r border-border bg-bg-elevated transition-all duration-200 h-screen sticky top-0",
        sidebarCollapsed ? "w-[64px]" : "w-[260px]"
      )}
    >
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border shrink-0">
        <Terminal size={18} className="text-accent shrink-0" />
        {!sidebarCollapsed && <span className="font-mono text-sm tracking-tight text-ink truncate">restik://notes</span>}
      </div>

      {!sidebarCollapsed && (
        <div className="px-3 pt-3">
          <NewMenu parentId={null} onCreated={() => {}} />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5 mb-3">
          {primaryNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={label}>
                <Link
                  href={href}
                  title={label}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active ? "bg-accent/10 text-accent" : "text-ink-dim hover:text-ink hover:bg-bg-hover"
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {!sidebarCollapsed && (
          <>
            <p className="px-3 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-ink-faint">My Notes</p>
            <TreeChildren parentId={null} depth={0} />
          </>
        )}
      </nav>

      <div className="border-t border-border p-2 space-y-0.5">
        <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-dim hover:text-ink hover:bg-bg-hover transition-colors">
          <Settings size={16} className="shrink-0" />
          {!sidebarCollapsed && <span>Settings</span>}
        </Link>
        <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-dim hover:text-ink hover:bg-bg-hover transition-colors">
          <User size={16} className="shrink-0" />
          {!sidebarCollapsed && <span>Profile</span>}
        </Link>
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-faint hover:text-ink hover:bg-bg-hover transition-colors"
        >
          {sidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
