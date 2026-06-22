"use client";

import { useEffect } from "react";
import { setupAxiosInterceptors } from "@/lib/axios-inteceptor";
import { ToastProvider } from "@/components/ui/toast";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useServiceWorker } from "@/hooks/use-service-worker";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  useServiceWorker();

  return (
    <ToastProvider>
      <ErrorBoundary>
        <AuthGuard>{children}</AuthGuard>
      </ErrorBoundary>
    </ToastProvider>
  );
}
