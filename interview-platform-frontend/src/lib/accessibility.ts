/**
 * WCAG 2.1 AA Accessibility Utilities
 * 
 * Provides helpers for:
 * - Screen reader announcements (aria-live regions)
 * - Focus management
 * - Keyboard navigation
 * - Color contrast checking
 * - Skip navigation links
 */

/**
 * Announce a message to screen readers via aria-live region.
 * Creates a temporary element, announces, then removes it.
 */
export function announce(message: string, priority: "polite" | "assertive" = "polite"): void {
  if (typeof document === "undefined") return;

  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", priority);
  el.setAttribute("aria-atomic", "true");
  el.className = "sr-only";
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => {
    document.body.removeChild(el);
  }, 1000);
}

/**
 * Trap focus within a container (for modals/dialogs).
 * Returns a cleanup function to restore normal focus.
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  const focusable = container.querySelectorAll<HTMLElement>(focusableSelectors);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  };

  container.addEventListener("keydown", handleKeyDown);
  first?.focus();

  return () => {
    container.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Hook-style keyboard shortcut handler.
 * Use in components to add keyboard shortcuts.
 */
export function handleKeyboardShortcut(
  e: KeyboardEvent,
  shortcuts: Record<string, () => void>
): void {
  const key = [
    e.ctrlKey ? "ctrl" : "",
    e.shiftKey ? "shift" : "",
    e.altKey ? "alt" : "",
    e.key.toLowerCase(),
  ]
    .filter(Boolean)
    .join("+");

  if (shortcuts[key]) {
    e.preventDefault();
    shortcuts[key]();
  }
}

/**
 * Check if a color combination meets WCAG AA contrast ratio (4.5:1 for text).
 */
export function meetsContrastRatio(foreground: string, background: string): boolean {
  const getLuminance = (hex: string): number => {
    const rgb = hex.replace("#", "").match(/.{2}/g)?.map((c) => {
      const val = parseInt(c, 16) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    if (!rgb) return 0;
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return ratio >= 4.5;
}
