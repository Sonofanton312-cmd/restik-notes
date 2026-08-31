"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Terminal, Mail, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const configured = isSupabaseConfigured();

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-20 text-center">
      <Terminal size={28} className="text-accent mb-4" />
      <h1 className="text-xl font-semibold text-ink font-mono">restik://notes</h1>
      <p className="mt-1 text-sm text-ink-faint">Sign in to edit your private notes.</p>

      {!configured ? (
        <div className="mt-8 rounded-xl border border-border bg-bg-elevated p-5 text-left text-sm text-ink-dim">
          <p className="mb-2 font-medium text-ink">Supabase isn&apos;t connected yet.</p>
          <p>
            You&apos;re browsing local sample data, which doesn&apos;t require an account. Follow the
            README&apos;s Supabase setup steps, add your <code className="text-accent-2">.env.local</code>,
            then this page will let you sign in with a magic link.
          </p>
        </div>
      ) : status === "sent" ? (
        <div className="mt-8 flex flex-col items-center gap-2 rounded-xl border border-border bg-bg-elevated p-6">
          <CheckCircle2 size={22} className="text-accent" />
          <p className="text-sm text-ink">Check your inbox</p>
          <p className="text-xs text-ink-faint">We sent a sign-in link to {email}</p>
        </div>
      ) : (
        <form onSubmit={sendMagicLink} className="mt-8 w-full space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2.5">
            <Mail size={15} className="text-ink-faint shrink-0" />
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {status === "sending" ? "Sending link…" : "Send magic link"}
          </button>
          {status === "error" && <p className="text-xs text-red-500">{errorMsg}</p>}
        </form>
      )}
    </div>
  );
}
