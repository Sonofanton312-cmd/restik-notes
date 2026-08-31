"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "restik-notes-theme";

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) || "system";
    setTheme(stored);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  const options: { key: Theme; label: string; icon: typeof Sun }[] = [
    { key: "light", label: "Light", icon: Sun },
    { key: "dark", label: "Dark", icon: Moon },
    { key: "system", label: "System", icon: Monitor }
  ];

  return (
    <div className={compact ? "flex items-center gap-1" : "flex items-center gap-1 rounded-lg border border-border p-1"}>
      {options.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => choose(key)}
          aria-label={label}
          title={label}
          className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${
            theme === key ? "bg-accent/15 text-accent" : "text-ink-faint hover:text-ink hover:bg-bg-hover"
          }`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
