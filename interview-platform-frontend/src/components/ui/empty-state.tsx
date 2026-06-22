import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateType =
  | "no-data"
  | "no-results"
  | "no-interviews"
  | "no-documents"
  | "no-teams"
  | "error";

interface EmptyStateProps {
  type: EmptyStateType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

function Illustration({ type }: { type: EmptyStateType }) {
  const baseClass = "h-32 w-32 text-indigo-400";

  switch (type) {
    case "no-data":
      return (
        <svg className={baseClass} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="24" y="36" width="80" height="64" rx="8" stroke="currentColor" strokeWidth="2.5" />
          <path d="M24 52h80" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="36" cy="44" r="3" fill="currentColor" opacity="0.5" />
          <circle cx="46" cy="44" r="3" fill="currentColor" opacity="0.5" />
          <circle cx="56" cy="44" r="3" fill="currentColor" opacity="0.5" />
          <path d="M44 72h40M44 84h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      );
    case "no-results":
      return (
        <svg className={baseClass} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="56" cy="56" r="24" stroke="currentColor" strokeWidth="2.5" />
          <path d="M74 74l20 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M48 56h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      );
    case "no-interviews":
      return (
        <svg className={baseClass} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="28" y="24" width="72" height="80" rx="8" stroke="currentColor" strokeWidth="2.5" />
          <path d="M28 44h72" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="64" cy="32" r="4" fill="currentColor" opacity="0.5" />
          <path d="M44 60h40M44 72h40M44 84h28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
          <path d="M80 80l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          <circle cx="92" cy="92" r="6" stroke="currentColor" strokeWidth="2.5" opacity="0.6" />
        </svg>
      );
    case "no-documents":
      return (
        <svg className={baseClass} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M36 24h40l20 20v60a8 8 0 01-8 8H36a8 8 0 01-8-8V32a8 8 0 018-8z" stroke="currentColor" strokeWidth="2.5" />
          <path d="M76 24v20h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M48 64h32M48 76h32M48 88h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      );
    case "no-teams":
      return (
        <svg className={baseClass} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="64" cy="40" r="14" stroke="currentColor" strokeWidth="2.5" />
          <path d="M40 96c0-13.255 10.745-24 24-24s24 10.745 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="96" cy="48" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.5" />
          <path d="M104 88c0-8.837-5.373-16-12-16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          <circle cx="32" cy="48" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.5" />
          <path d="M24 88c0-8.837 5.373-16 12-16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      );
    case "error":
      return (
        <svg className={baseClass} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="64" cy="64" r="36" stroke="currentColor" strokeWidth="2.5" />
          <path d="M64 44v24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="64" cy="80" r="3" fill="currentColor" />
        </svg>
      );
  }
}

export function EmptyState({ type, title, description, action }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        "animate-in fade-in slide-in-from-bottom-4 duration-500"
      )}
    >
      <div className="mb-6">
        <Illustration type={type} />
      </div>

      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      )}

      {action && (
        <Button onClick={action.onClick} variant="default" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
