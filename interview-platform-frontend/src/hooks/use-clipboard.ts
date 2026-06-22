"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Hook for copying text to the clipboard.
 *
 * Returns:
 * - `copy(text)` – copies the given text to the clipboard
 * - `copied` – boolean that stays `true` for 2 seconds after a successful copy
 *
 * Uses `navigator.clipboard.writeText` with a `document.execCommand` fallback
 * for older browsers.
 */
export function useClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for older browsers
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.left = "-9999px";
          textarea.style.top = "-9999px";
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }

        setCopied(true);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, resetDelay);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
        setCopied(false);
      }
    },
    [resetDelay]
  );

  return { copy, copied };
}
