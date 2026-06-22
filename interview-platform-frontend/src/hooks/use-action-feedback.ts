"use client";

import { useToast } from "@/components/ui/toast";
import { useCallback } from "react";

/**
 * Hook for showing toast feedback on CRUD operations.
 * Wraps async operations with success/error toasts.
 */
export function useActionFeedback() {
  const { addToast } = useToast();

  const withFeedback = useCallback(
    async <T>(
      action: () => Promise<T>,
      options: {
        successTitle?: string;
        successDescription?: string;
        errorTitle?: string;
        errorDescription?: string;
        loadingTitle?: string;
      } = {}
    ): Promise<T | null> => {
      try {
        const result = await action();
        addToast({
          title: options.successTitle || "Success",
          description: options.successDescription,
          variant: "success",
        });
        return result;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        addToast({
          title: options.errorTitle || "Error",
          description:
            options.errorDescription ||
            err?.response?.data?.message ||
            err?.message ||
            "Something went wrong",
          variant: "destructive",
        });
        return null;
      }
    },
    [addToast]
  );

  const showSuccess = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: "success" });
    },
    [addToast]
  );

  const showError = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: "destructive" });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: "warning" });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: "default" });
    },
    [addToast]
  );

  return { withFeedback, showSuccess, showError, showWarning, showInfo };
}

/**
 * Keyboard shortcut definitions for display in UI
 */
export const KEYBOARD_SHORTCUTS = [
  { keys: ["⌘", "K"], description: "Open command palette" },
  { keys: ["g", "d"], description: "Go to Dashboard" },
  { keys: ["g", "i"], description: "Go to Interviews" },
  { keys: ["g", "j"], description: "Go to Jobs" },
  { keys: ["g", "q"], description: "Go to Questions" },
  { keys: ["g", "t"], description: "Go to Teams" },
  { keys: ["g", "r"], description: "Go to Reports" },
  { keys: ["g", "n"], description: "Go to Notifications" },
  { keys: ["g", "s"], description: "Go to Scheduling" },
  { keys: ["Esc"], description: "Close dialogs" },
] as const;
