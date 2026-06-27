"use client";

/**
 * Skip Navigation Links (WCAG 2.4.1)
 * Allows keyboard users to skip directly to main content.
 * Visible only when focused (Tab key).
 */
export default function SkipNavigation() {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-0 focus-within:left-0 focus-within:z-[9999] focus-within:w-full focus-within:bg-white focus-within:p-2 focus-within:shadow-md">
      <a
        href="#main-content"
        className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="ml-2 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to navigation
      </a>
    </div>
  );
}
