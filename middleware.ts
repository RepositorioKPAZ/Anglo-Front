import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Define protected and public paths for easier maintenance
const protectedPaths = [
  '/protected',
  '/(main)',
  '/postulaciones',
  '/nominas',
  '/carga-adjuntos',
  '/carga-masiva',
  '/dashboard'  // Added dashboard as protected path
];

const publicPaths = [
  '/',
  '/db-sign-in',
  '/sign-in',
  '/sign-up',
  '/forgot-password'
];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Simplified path checking
  const isProtectedPath = protectedPaths.some(p => path.startsWith(p));
  const isPublicPath = publicPaths.includes(path);

  const token = request.cookies.get("auth-token")?.value;

  // If the path is protected and no token exists, redirect to sign in
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/db-sign-in", request.url));
  }

  // If token exists and user is trying to access public auth pages, redirect to appropriate area
  if (token && isPublicPath) {
    try {
      // Verify the token is valid and not expired
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET || 'multibien_secret_key_please_change_in_production')
      );

      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Clear expired token
        const response = NextResponse.redirect(new URL("/db-sign-in", request.url));
        response.cookies.delete("auth-token");
        return response;
      }

      // Check if user is admin and redirect accordingly
      const isAdmin = payload.empresa === "admin";
      const redirectPath = isAdmin ? "/dashboard" : "/postulaciones/empresa";
      
      return NextResponse.redirect(new URL(redirectPath, request.url));
    } catch (error) {
      // Clear invalid token and redirect to sign in
      const response = NextResponse.redirect(new URL("/db-sign-in", request.url));
      response.cookies.delete("auth-token");
      console.error("Token verification failed:", error);
      return response;
    }
  }

  return NextResponse.next();
}

// Aligned matcher configuration with path checking logic
export const config = {
  matcher: [
    // Protected routes
    "/protected/:path*",
    "/(main)/:path*",
    "/postulaciones/:path*",
    "/nominas/:path*", 
    "/carga-adjuntos/:path*",
    "/carga-masiva/:path*",
    "/dashboard/:path*",  // Added dashboard to matcher
    // Auth routes
    "/",
    "/db-sign-in",
    "/sign-in",
    "/sign-up",
    "/forgot-password",
  ],
};
