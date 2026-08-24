import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Protected routes - only logged in users can access
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/payment-matcher/:path*",
    "/account/:path*",
    "/reconciliation/:path*",
    "/filing-checker/:path*",
    "/calculators/:path*",
    "/admin/:path*",
  ],
};

export async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const token = await getToken({ req: request });
  const isLoggedIn = !!token;

  // Redirect to login if trying to access protected routes without being logged in
  if (!isLoggedIn) {
    const loginUrl = new URL("/auth/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged in users away from auth pages
  const authRoutes = ["/auth/login", "/auth/signup"];
  const isAuthRoute = authRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
}
