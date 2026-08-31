import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Protects /editor routes once Supabase is configured. Until then (no env
 * vars set), the middleware is a no-op so the app keeps working in local
 * sample-data mode with zero setup.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Not configured yet — let everything through.
  if (!url || !key) return NextResponse.next();

  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: "", ...options });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/new") ||
    request.nextUrl.pathname.startsWith("/n/") ||
    request.nextUrl.pathname.startsWith("/f/") ||
    ["/important", "/recent", "/trash"].includes(request.nextUrl.pathname);

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/new/:path*", "/n/:path*", "/f/:path*", "/important", "/recent", "/trash"]
};
