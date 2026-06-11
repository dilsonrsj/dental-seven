import { NextRequest, NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE, isValidDemoSession } from "@/lib/demo-session";

const PUBLIC_PATHS = ["/entrar", "/api/auth/demo"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const session = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  const authenticated = isValidDemoSession(session);

  if (pathname === "/entrar" && authenticated) {
    return NextResponse.redirect(new URL("/agenda", request.url));
  }

  if (!isPublic && !authenticated) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand).*)"],
};
