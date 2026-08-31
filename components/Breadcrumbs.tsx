import Link from "next/link";
import { NodePath } from "@/types/node";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs({ path, current }: { path: NodePath; current?: string }) {
  return (
    <nav className="flex items-center gap-1 flex-wrap text-xs text-ink-faint">
      <Link href="/f/root" className="hover:text-accent transition-colors font-mono">
        My Notes
      </Link>
      {path.map((p) => (
        <span key={p.id} className="flex items-center gap-1">
          <ChevronRight size={12} />
          <Link href={p.type === "folder" ? `/f/${p.id}` : `/n/${p.id}`} className="hover:text-accent transition-colors truncate max-w-[10rem]">
            {p.name}
          </Link>
        </span>
      ))}
      {current && (
        <span className="flex items-center gap-1">
          <ChevronRight size={12} />
          <span className="text-ink-dim truncate max-w-[10rem]">{current}</span>
        </span>
      )}
    </nav>
  );
}
