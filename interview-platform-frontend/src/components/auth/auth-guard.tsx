"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/oauth2",
];

// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Protected route wrapper.
 * Redirects unauthenticated users to /login.
 * Redirects non-admin users away from /admin routes.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, user } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // Check if current route is public
      const isPublicRoute = PUBLIC_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
      );

      if (isPublicRoute) {
        // If authenticated user visits login/register, redirect to dashboard
        if (accessToken && (pathname === "/login" || pathname === "/register")) {
          router.replace("/dashboard");
          return;
        }
        setAuthorized(true);
        setChecked(true);
        return;
      }

      // Protected route - check authentication
      if (!accessToken) {
        // Store intended destination for post-login redirect
        const returnUrl = encodeURIComponent(pathname);
        router.replace(`/login?returnUrl=${returnUrl}`);
        setAuthorized(false);
        setChecked(true);
        return;
      }

      // Check admin routes
      const isAdminRoute = ADMIN_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
      );

      if (isAdminRoute) {
        const userRoles = user?.roles || [];
        if (!userRoles.includes("ADMIN")) {
          router.replace("/dashboard");
          setAuthorized(false);
          setChecked(true);
          return;
        }
      }

      setAuthorized(true);
      setChecked(true);
    };

    checkAuth();
  }, [pathname, accessToken, user, router]);

  // Show nothing while checking auth (prevents flash of protected content)
  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  return <>{children}</>;
}
