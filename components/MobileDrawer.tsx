"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Star, Clock, Trash2, Settings, User, Terminal, X } from "lucide-react";
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

export default function MobileDrawer() {
  const { drawerOpen, setDrawerOpen } = useUI();
  const pathname = usePathname();

  if (!drawerOpen) return null;
  const close = () => setDrawerOpen(false);

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button aria-label="Close menu" className="absolute inset-0 bg-black/50" onClick={close} />
      <div className="absolute left-0 top-0 h-full w-[84%] max-w-[320px] bg-bg-elevated border-r border-border flex flex-col">
        <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
          <span className="flex items-center gap-2 font-mono text-sm text-ink">
            <Terminal size={18} className="text-accent" />
            restik://notes
          </span>
          <button onClick={close} className="p-2 -mr-2 text-ink-dim active:bg-bg-hover rounded-lg" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="px-3 pt-3">
          <NewMenu parentId={null} onCreated={close} />
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul className="space-y-0.5 mb-3">
            {primaryNav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={label}>
                  <Link
                    href={href}
                    onClick={close}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] transition-colors",
                      active ? "bg-accent/10 text-accent" : "text-ink-dim active:bg-bg-hover"
                    )}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="px-3 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-ink-faint">My Notes</p>
          <TreeChildren parentId={null} depth={0} onNavigate={close} />
        </nav>

        <div className="border-t border-border p-2 space-y-0.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Link href="/settings" onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] text-ink-dim active:bg-bg-hover">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <Link href="/settings" onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] text-ink-dim active:bg-bg-hover">
            <User size={18} />
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
