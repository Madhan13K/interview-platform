"use client";

import { useEffect, useRef, useState } from "react";

interface LiveRegionProps {
  message: string;
  priority?: "polite" | "assertive";
}

/**
 * Accessible live region for dynamic announcements.
 * Screen readers will announce changes to the message prop.
 */
export default function LiveRegion({ message, priority = "polite" }: LiveRegionProps) {
  const [announced, setAnnounced] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (message) {
      // Clear and re-set to trigger announcement even for same message
      setAnnounced("");
      timeoutRef.current = setTimeout(() => setAnnounced(message), 100);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [message]);

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {announced}
    </div>
  );
}
