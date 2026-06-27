import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for subdomain-based SSO tenant detection.
 * 
 * If the request comes from a subdomain (e.g., acme.interview-platform.com),
 * the subdomain is extracted and passed as a query param to the login page.
 * This enables automatic SSO provider detection without user input.
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost:3000";

  // Strip port from comparison if present
  const baseHost = baseDomain.split(":")[0];
  const requestHost = hostname.split(":")[0];

  // Extract subdomain: "acme.interview.local" → "acme"
  let subdomain = "";
  if (requestHost.endsWith(`.${baseHost}`)) {
    subdomain = requestHost.replace(`.${baseHost}`, "");
  }

  // Ignore common non-tenant subdomains
  const ignoredSubdomains = ["www", "app", "api", "admin", "mail", "static"];
  const isValidSubdomain = subdomain.length > 0 && !ignoredSubdomains.includes(subdomain);

  if (isValidSubdomain && request.nextUrl.pathname === "/login") {
    // Add org param to login page for subdomain-based SSO detection
    if (!request.nextUrl.searchParams.has("org")) {
      const url = request.nextUrl.clone();
      url.searchParams.set("org", subdomain);
      return NextResponse.redirect(url);
    }
  }

  // Pass subdomain as header for downstream use
  const response = NextResponse.next();
  if (isValidSubdomain) {
    response.headers.set("x-tenant-slug", subdomain);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
