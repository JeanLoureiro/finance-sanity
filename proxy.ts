import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that require authentication
const PROTECTED_PREFIXES = [
  "/net-worth",
  "/cash",
  "/stocks",
  "/etfs",
  "/crypto",
  "/managed-funds",
  "/dividends",
  "/budget",
  "/loans",
  "/property",
  "/super",
  "/side-income",
  "/other-assets",
  "/capital-gains",
  "/fire",
  "/import",
  "/settings",
  "/api/",
];

// Paths that are always public (even under /api/)
const PUBLIC_PREFIXES = ["/login", "/auth/", "/accept-invite"];

function isPublicApiPath(pathname: string): boolean {
  // GET /api/invitations/[token] is public (invite metadata for accept page)
  // POST /api/invitations/[token]/accept requires auth — handled by the route itself
  return (
    /^\/api\/invitations\/[^/]+$/.test(pathname) // exactly /api/invitations/<token>
  );
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isPublic(pathname: string): boolean {
  return (
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    isPublicApiPath(pathname)
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always call getUser() — not getSession() — to verify the token server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isProtected(pathname) && !isPublic(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
