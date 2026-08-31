"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useData } from "@/lib/DataContext";
import { Download } from "lucide-react";

export default function SettingsPage() {
  const data = useData();
  const [email, setEmail] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;
    const supabase = createSupabaseBrowserClient();
    supabase?.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [configured]);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
    window.location.href = "/";
  }

  async function exportNotes() {
    setExporting(true);
    try {
      const nodes = await data.exportTree();
      const blob = new Blob([JSON.stringify(nodes, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `restik-notes-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="text-xl sm:text-2xl font-semibold text-ink font-mono">Settings</h1>

      <section className="mt-6 rounded-xl border border-border bg-bg-elevated p-5">
        <h2 className="text-sm font-medium text-ink mb-3">Appearance</h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-faint">Theme</p>
          <ThemeToggle />
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-bg-elevated p-5">
        <h2 className="text-sm font-medium text-ink mb-3">Account</h2>
        {!configured ? (
          <p className="text-sm text-ink-faint">
            Supabase isn&apos;t connected — you&apos;re browsing local demo data that only lasts this
            session. See the README to add your own account.
          </p>
        ) : email ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-dim">Signed in as {email}</p>
            <button onClick={signOut} className="rounded-lg border border-border px-3 py-1.5 text-xs text-ink-dim hover:text-ink hover:bg-bg-hover">
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-faint">Not signed in</p>
            <Link href="/login" className="rounded-lg border border-border px-3 py-1.5 text-xs text-ink-dim hover:text-ink hover:bg-bg-hover">
              Sign in
            </Link>
          </div>
        )}
      </section>

      <section className="mt-4 rounded-xl border border-border bg-bg-elevated p-5">
        <h2 className="text-sm font-medium text-ink mb-3">Data source</h2>
        <p className="text-sm text-ink-faint leading-relaxed">
          {configured
            ? "Connected to Supabase — your whole folder tree, questions, notes, files, and links sync across every device you sign in on."
            : "Currently browsing a local demo tree that resets on refresh. Connect Supabase (see README) so your own notes persist and sync across devices."}
        </p>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-bg-elevated p-5">
        <h2 className="text-sm font-medium text-ink mb-3">Export</h2>
        <p className="text-sm text-ink-faint leading-relaxed mb-3">
          Download your entire tree — every folder, question, note, file reference, and link — as a single
          JSON file. You&apos;re never locked in.
        </p>
        <button
          onClick={exportNotes}
          disabled={exporting}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm text-ink-dim hover:bg-bg-hover disabled:opacity-50"
        >
          <Download size={14} /> {exporting ? "Preparing…" : "Export as JSON"}
        </button>
      </section>
    </div>
  );
}
