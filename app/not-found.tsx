import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="font-mono text-4xl text-accent mb-2">404</p>
      <h1 className="text-lg font-medium text-ink">Note not found</h1>
      <p className="mt-1 text-sm text-ink-faint">This question doesn&apos;t exist, or was moved.</p>
      <Link
        href="/"
        className="mt-6 rounded-lg border border-border px-4 py-2 text-sm text-ink-dim hover:bg-bg-hover"
      >
        Back home
      </Link>
    </div>
  );
}
