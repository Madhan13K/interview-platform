"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ShortcutCategory {
  name: string;
  icon: string;
  shortcuts: Shortcut[];
}

interface Shortcut {
  id: string;
  keys: string[];
  description: string;
  context?: string;
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    name: "Navigation",
    icon: "🧭",
    shortcuts: [
      { id: "nav-1", keys: ["⌘", "K"], description: "Open command palette" },
      { id: "nav-2", keys: ["⌘", "⇧", "P"], description: "Quick search" },
      { id: "nav-3", keys: ["⌘", "/"], description: "Go to dashboard" },
      { id: "nav-4", keys: ["⌘", "1"], description: "Go to candidates" },
      { id: "nav-5", keys: ["⌘", "2"], description: "Go to interviews" },
      { id: "nav-6", keys: ["⌘", "3"], description: "Go to pipelines" },
      { id: "nav-7", keys: ["⌘", "4"], description: "Go to analytics" },
      { id: "nav-8", keys: ["⌘", "⇧", "N"], description: "Create new" },
    ],
  },
  {
    name: "Interview Room",
    icon: "🎥",
    shortcuts: [
      { id: "int-1", keys: ["⌘", "M"], description: "Toggle microphone", context: "Interview" },
      { id: "int-2", keys: ["⌘", "E"], description: "Toggle camera", context: "Interview" },
      { id: "int-3", keys: ["⌘", "⇧", "S"], description: "Share screen", context: "Interview" },
      { id: "int-4", keys: ["⌘", "⇧", "R"], description: "Start/stop recording", context: "Interview" },
      { id: "int-5", keys: ["⌘", "⇧", "B"], description: "Add bookmark", context: "Interview" },
      { id: "int-6", keys: ["⌘", "⇧", "W"], description: "Toggle whiteboard", context: "Interview" },
    ],
  },
  {
    name: "Code Editor",
    icon: "💻",
    shortcuts: [
      { id: "code-1", keys: ["⌘", "Enter"], description: "Run code", context: "Editor" },
      { id: "code-2", keys: ["⌘", "S"], description: "Save snapshot", context: "Editor" },
      { id: "code-3", keys: ["⌘", "⇧", "F"], description: "Format code", context: "Editor" },
      { id: "code-4", keys: ["⌘", "D"], description: "Select next occurrence", context: "Editor" },
      { id: "code-5", keys: ["⌘", "L"], description: "Select line", context: "Editor" },
      { id: "code-6", keys: ["⌘", "["], description: "Indent left", context: "Editor" },
      { id: "code-7", keys: ["⌘", "]"], description: "Indent right", context: "Editor" },
    ],
  },
  {
    name: "Candidate Actions",
    icon: "👤",
    shortcuts: [
      { id: "cand-1", keys: ["A"], description: "Advance candidate", context: "Pipeline" },
      { id: "cand-2", keys: ["R"], description: "Reject candidate", context: "Pipeline" },
      { id: "cand-3", keys: ["N"], description: "Add note", context: "Candidate" },
      { id: "cand-4", keys: ["S"], description: "Schedule interview", context: "Candidate" },
      { id: "cand-5", keys: ["E"], description: "Send email", context: "Candidate" },
      { id: "cand-6", keys: ["⇧", "A"], description: "Select all", context: "List" },
    ],
  },
  {
    name: "Global",
    icon: "🌐",
    shortcuts: [
      { id: "glob-1", keys: ["?"], description: "Show this help panel" },
      { id: "glob-2", keys: ["Esc"], description: "Close modal / Go back" },
      { id: "glob-3", keys: ["⌘", "."], description: "Toggle sidebar" },
      { id: "glob-4", keys: ["⌘", "⇧", "D"], description: "Toggle dark mode" },
      { id: "glob-5", keys: ["⌘", "⇧", "M"], description: "Mark all notifications read" },
      { id: "glob-6", keys: ["⌘", "⇧", "L"], description: "Log out" },
    ],
  },
];

export default function ShortcutsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);

  // Track keyboard usage
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveCategory(null);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredCategories = SHORTCUT_CATEGORIES.map((category) => ({
    ...category,
    shortcuts: category.shortcuts.filter(
      (s) =>
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.keys.join(" ").toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((c) => (activeCategory ? c.name === activeCategory : true) && c.shortcuts.length > 0);

  const totalShortcuts = SHORTCUT_CATEGORIES.reduce((sum, c) => sum + c.shortcuts.length, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Keyboard Shortcuts</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalShortcuts} shortcuts across {SHORTCUT_CATEGORIES.length} categories
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Press <kbd className="px-1 py-0.5 rounded bg-slate-200 font-mono text-xs">?</kbd> anywhere to open
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search shortcuts..."
          className="w-full px-4 py-3 pl-10 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        />
        <svg
          className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !activeCategory ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          All
        </button>
        {SHORTCUT_CATEGORIES.map((category) => (
          <button
            key={category.name}
            onClick={() => setActiveCategory(activeCategory === category.name ? null : category.name)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeCategory === category.name
                ? "bg-indigo-100 text-indigo-700"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <span>{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Shortcuts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredCategories.map((category) => (
          <Card key={category.name}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span>{category.icon}</span>
                {category.name}
                <Badge variant="secondary" className="text-xs ml-auto">
                  {category.shortcuts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {category.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-700">{shortcut.description}</span>
                      {shortcut.context && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {shortcut.context}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, idx) => (
                        <span key={idx}>
                          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded border border-slate-200 bg-white shadow-sm text-xs font-mono font-medium text-slate-600">
                            {key}
                          </kbd>
                          {idx < shortcut.keys.length - 1 && (
                            <span className="text-slate-300 mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">No shortcuts found matching &quot;{searchQuery}&quot;</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setSearchQuery("")}>
            Clear search
          </Button>
        </div>
      )}

      {/* Help Footer */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>💡</span>
            <span>Pro tip: Use <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-xs font-mono">⌘ K</kbd> to quickly access any feature</span>
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            Print Cheatsheet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
