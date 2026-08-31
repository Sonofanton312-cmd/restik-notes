"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Safe to import in Client Components.
 * Returns null (instead of throwing) when env vars aren't set yet, so the
 * app can still run in "local sample data" mode before Supabase is wired up.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createBrowserClient(url, key);
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
