"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

interface ProgressBarState {
  isLoading: boolean;
  progress: number;
  isVisible: boolean;
}

export function useProgressBar() {
  const [state, setState] = useState<ProgressBarState>({
    isLoading: false,
    progress: 0,
    isVisible: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const crawlTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (crawlTimerRef.current) {
      clearInterval(crawlTimerRef.current);
      crawlTimerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    cleanup();
    setState({ isLoading: true, progress: 0, isVisible: true });

    // Quickly jump to 30%
    timerRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, progress: 30 }));

      // Slowly crawl to 80%
      crawlTimerRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.progress >= 80) {
            if (crawlTimerRef.current) {
              clearInterval(crawlTimerRef.current);
              crawlTimerRef.current = null;
            }
            return prev;
          }
          const increment = Math.random() * 3 + 1;
          return { ...prev, progress: Math.min(prev.progress + increment, 80) };
        });
      }, 500);
    }, 100);
  }, [cleanup]);

  const done = useCallback(() => {
    cleanup();
    setState((prev) => ({ ...prev, progress: 100, isLoading: false }));

    // Fade out after completing
    timerRef.current = setTimeout(() => {
      setState({ isLoading: false, progress: 0, isVisible: false });
    }, 300);
  }, [cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { start, done, isLoading: state.isLoading, state };
}

export function ProgressBar() {
  const pathname = usePathname();
  const { start, done, state } = useProgressBar();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    start();
    // Done after the new page renders
    const timeout = setTimeout(() => {
      done();
    }, 150);
    return () => clearTimeout(timeout);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state.isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      role="progressbar"
      aria-valuenow={state.progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-[3px] bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 shadow-[0_0_10px_rgba(79,70,229,0.7),0_0_5px_rgba(79,70,229,0.5)] transition-all duration-300 ease-out ${
          state.progress === 100 ? "opacity-0" : "opacity-100"
        }`}
        style={{ width: `${state.progress}%` }}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent bg-[length:200%_100%]" />
        </div>
        {/* Glow tip */}
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white/40 to-transparent" />
      </div>

      {/* Inline style for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
}
