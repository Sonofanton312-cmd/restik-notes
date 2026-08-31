import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Handles the redirect after a user clicks their magic-link email.
// Exchanges the one-time code for a real session, stored in cookies.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
