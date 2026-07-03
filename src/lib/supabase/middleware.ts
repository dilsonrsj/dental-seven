import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  IMPERSONATION_COOKIE,
  isImpersonationBlockedPath,
  isImpersonationValid,
  parseImpersonationCookie,
} from "@/modules/admin/impersonation";
import {
  defaultAppPathForRole,
  isClinicAppPath,
} from "@/lib/auth/routes";

const PUBLIC_PATHS = ["/entrar", "/cadastro", "/visao", "/api/webhooks/asaas"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = pathname === "/entrar" || pathname === "/cadastro";

  let profileRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    profileRole = profile?.role ?? null;
  }

  const isSuperAdmin = profileRole === "super_admin";
  const impersonationPayload = parseImpersonationCookie(
    request.cookies.get(IMPERSONATION_COOKIE)?.value,
  );
  const hasValidImpersonation =
    Boolean(user) &&
    Boolean(impersonationPayload) &&
    isImpersonationValid(impersonationPayload!, user!.id);

  if (user && isAuthPage) {
    return NextResponse.redirect(
      new URL(defaultAppPathForRole(profileRole), request.url),
    );
  }

  if (user && isSuperAdmin && isClinicAppPath(pathname)) {
    if (!hasValidImpersonation) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (isImpersonationBlockedPath(pathname)) {
      return NextResponse.redirect(new URL("/agenda", request.url));
    }
  }

  if (hasValidImpersonation && isImpersonationBlockedPath(pathname)) {
    return NextResponse.redirect(new URL("/agenda", request.url));
  }

  if (!user && !isPublic && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }

  return supabaseResponse;
}
