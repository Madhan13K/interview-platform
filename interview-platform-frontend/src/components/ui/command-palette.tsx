"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: string;
  section: "quick-actions" | "navigation" | "recent";
  path?: string;
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const navigationItems: CommandItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    section: "navigation",
    path: "/dashboard",
  },
  {
    id: "interviews",
    title: "Interviews",
    description: "Manage interview sessions",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    section: "navigation",
    path: "/interviews",
  },
  {
    id: "scheduling",
    title: "Scheduling",
    description: "Schedule and manage interviews",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    section: "navigation",
    path: "/scheduling",
  },
  {
    id: "jobs",
    title: "Jobs",
    description: "Job postings and positions",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    section: "navigation",
    path: "/jobs",
  },
  {
    id: "pipelines",
    title: "Pipelines",
    description: "Hiring pipelines and workflows",
    icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
    section: "navigation",
    path: "/pipelines",
  },
  {
    id: "questions",
    title: "Questions",
    description: "Interview question bank",
    icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    section: "navigation",
    path: "/questions",
  },
  {
    id: "templates",
    title: "Templates",
    description: "Interview and email templates",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    section: "navigation",
    path: "/templates",
  },
  {
    id: "teams",
    title: "Teams",
    description: "Team management",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    section: "navigation",
    path: "/teams",
  },
  {
    id: "reports",
    title: "Reports",
    description: "Analytics and reporting",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    section: "navigation",
    path: "/reports",
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    description: "AI-powered interview assistant",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    section: "navigation",
    path: "/ai-assistant",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Alerts and notifications",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    section: "navigation",
    path: "/notifications",
  },
  {
    id: "documents",
    title: "Documents",
    description: "Document management",
    icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    section: "navigation",
    path: "/documents",
  },
  {
    id: "activity",
    title: "Activity",
    description: "Activity log and history",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    section: "navigation",
    path: "/activity",
  },
  {
    id: "organizations",
    title: "Organizations",
    description: "Organization settings",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    section: "navigation",
    path: "/organizations",
  },
  {
    id: "settings",
    title: "Settings",
    description: "Application settings",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    section: "navigation",
    path: "/settings",
  },
];

const quickActionItems: CommandItem[] = [
  {
    id: "schedule-interview",
    title: "Schedule Interview",
    description: "Create a new interview session",
    icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    section: "quick-actions",
    path: "/scheduling/new",
  },
  {
    id: "add-question",
    title: "Add Question",
    description: "Add a new interview question",
    icon: "M12 4v16m8-8H4",
    section: "quick-actions",
    path: "/questions/new",
  },
  {
    id: "create-template",
    title: "Create Template",
    description: "Create a new interview template",
    icon: "M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    section: "quick-actions",
    path: "/templates/new",
  },
  {
    id: "generate-report",
    title: "Generate Report",
    description: "Generate an analytics report",
    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    section: "quick-actions",
    path: "/reports/new",
  },
];

const allItems: CommandItem[] = [...quickActionItems, ...navigationItems];

function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let queryIndex = 0;

  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === lowerQuery.length;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const result: React.ReactNode[] = [];
  let queryIndex = 0;
  let lastMatchEnd = 0;

  for (let i = 0; i < text.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      if (i > lastMatchEnd) {
        result.push(
          <span key={`text-${lastMatchEnd}`}>{text.slice(lastMatchEnd, i)}</span>
        );
      }
      result.push(
        <span key={`match-${i}`} className="text-indigo-600 font-semibold">
          {text[i]}
        </span>
      );
      lastMatchEnd = i + 1;
      queryIndex++;
    }
  }

  if (lastMatchEnd < text.length) {
    result.push(
      <span key={`text-${lastMatchEnd}`}>{text.slice(lastMatchEnd)}</span>
    );
  }

  return <>{result}</>;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    return allItems.filter((item) => fuzzyMatch(item.title, query));
  }, [query]);

  const groupedItems = useMemo(() => {
    const quickActions = filteredItems.filter((i) => i.section === "quick-actions");
    const navigation = filteredItems.filter((i) => i.section === "navigation");
    const recent = filteredItems.filter((i) => i.section === "recent");

    const sections: { label: string; items: CommandItem[] }[] = [];
    if (quickActions.length > 0) sections.push({ label: "Quick Actions", items: quickActions });
    if (navigation.length > 0) sections.push({ label: "Navigation", items: navigation });
    if (recent.length > 0) sections.push({ label: "Recent", items: recent });

    return sections;
  }, [filteredItems]);

  const flatItems = useMemo(() => {
    return groupedItems.flatMap((section) => section.items);
  }, [groupedItems]);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      if (item.path) {
        router.push(item.path);
      }
      onClose();
      setQuery("");
      setSelectedIndex(0);
    },
    [router, onClose]
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Keyboard shortcut to open (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Internal keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % flatItems.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
          break;
        case "Enter":
          e.preventDefault();
          if (flatItems[selectedIndex]) {
            handleSelect(flatItems[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, flatItems, selectedIndex, handleSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!open) return null;

  let globalIndex = 0;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center pt-[15vh]",
        "bg-slate-900/60 backdrop-blur-sm",
        "sheet-enter"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden",
          "transform transition-all duration-200",
          "sheet-enter"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200">
          <svg
            className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, pages, actions..."
            className="flex-1 text-sm text-slate-900 placeholder-slate-400 bg-transparent outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium text-slate-400 bg-slate-100 rounded border border-slate-200">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[70vh] overflow-y-auto py-2">
          {flatItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            groupedItems.map((section) => (
              <div key={section.label}>
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {section.label}
                </div>
                {section.items.map((item) => {
                  const itemIndex = globalIndex++;
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      data-index={itemIndex}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-indigo-50 text-indigo-900"
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg",
                          isSelected ? "bg-indigo-100" : "bg-slate-100"
                        )}
                      >
                        <svg
                          className={cn(
                            "w-4 h-4",
                            isSelected ? "text-indigo-600" : "text-slate-500"
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={item.icon}
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {highlightMatch(item.title, query)}
                        </div>
                        {item.description && (
                          <div className="text-xs text-slate-500 truncate">
                            {item.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0 text-xs text-indigo-400">
                          Enter to select
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[10px] font-medium">
                &uarr;
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[10px] font-medium">
                &darr;
              </kbd>
              <span className="ml-0.5">Navigate</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[10px] font-medium">
                Enter
              </kbd>
              <span className="ml-0.5">Select</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[10px] font-medium">
                Esc
              </kbd>
              <span className="ml-0.5">Close</span>
            </span>
          </div>
          <div className="text-xs text-slate-400">
            {flatItems.length} result{flatItems.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
