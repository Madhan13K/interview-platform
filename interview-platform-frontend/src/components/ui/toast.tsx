"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
  icon?: React.ReactNode;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const variantIcons = {
  success: (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ),
  destructive: (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
      <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  ),
  warning: (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
      <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
  ),
  default: (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
      <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
};

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-3 pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex w-[380px] items-start gap-3 rounded-xl border p-4 shadow-2xl toast-enter",
            "backdrop-blur-sm",
            toast.variant === "destructive" && "border-red-100 bg-white/95",
            toast.variant === "success" && "border-emerald-100 bg-white/95",
            toast.variant === "warning" && "border-amber-100 bg-white/95",
            (!toast.variant || toast.variant === "default") && "border-slate-100 bg-white/95"
          )}
          style={{
            transform: `translateY(${index * -4}px) scale(${1 - index * 0.02})`,
            opacity: 1 - index * 0.15,
          }}
        >
          {/* Icon */}
          {toast.icon || variantIcons[toast.variant || "default"]}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
            {toast.description && (
              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{toast.description}</p>
            )}
          </div>

          {/* Close */}
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-4 right-4 h-0.5 overflow-hidden rounded-full">
            <div
              className={cn(
                "h-full rounded-full progress-animated",
                toast.variant === "destructive" && "bg-red-400",
                toast.variant === "success" && "bg-emerald-400",
                toast.variant === "warning" && "bg-amber-400",
                (!toast.variant || toast.variant === "default") && "bg-indigo-400"
              )}
              style={{ width: "100%", animation: "progress-shrink 4s linear forwards" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
