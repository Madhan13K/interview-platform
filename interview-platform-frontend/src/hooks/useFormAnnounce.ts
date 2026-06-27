"use client";

import { useEffect } from "react";
import { announce } from "@/lib/accessibility";

/**
 * Announces form errors to screen readers when they change.
 * WCAG 3.3.1 - Error Identification
 */
export function useFormAnnounce(errors: Record<string, { message?: string }>) {
  useEffect(() => {
    const messages = Object.values(errors)
      .map((e) => e?.message)
      .filter(Boolean);

    if (messages.length > 0) {
      announce(
        `Form has ${messages.length} error${messages.length > 1 ? "s" : ""}: ${messages.join(". ")}`,
        "assertive"
      );
    }
  }, [errors]);
}
