"use client";

import { useEffect } from "react";

/**
 * This route exists because Google's redirect-uri is configured as
 * http://localhost:3000/login/oauth2/code/google
 *
 * In production, this should point to the backend (e.g. http://localhost:8080/login/oauth2/code/google)
 * so Spring Security can exchange the code for tokens.
 *
 * If this page loads, it means the redirect-uri is misconfigured and pointing
 * to the frontend instead of the backend.
 */
export default function GoogleOAuthCodePage() {
  useEffect(() => {
    // Redirect this request to the backend so Spring Security can handle the code exchange
    const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    const currentUrl = new URL(window.location.href);
    const code = currentUrl.searchParams.get("code");
    const state = currentUrl.searchParams.get("state");

    if (code) {
      // Forward to backend with the same query params
      const backendCallback = `${backendUrl}/login/oauth2/code/google${currentUrl.search}`;
      window.location.href = backendCallback;
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
        <p className="text-slate-600">Processing authentication...</p>
      </div>
    </div>
  );
}
