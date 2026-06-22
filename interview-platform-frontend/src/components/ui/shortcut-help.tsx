"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  category: string;
  shortcuts: Shortcut[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: "Navigation",
    shortcuts: [
      { keys: ["Cmd", "K"], description: "Command Palette" },
      { keys: ["g", "d"], description: "Dashboard" },
      { keys: ["g", "i"], description: "Interviews" },
      { keys: ["g", "j"], description: "Jobs" },
      { keys: ["g", "q"], description: "Questions" },
      { keys: ["g", "t"], description: "Teams" },
      { keys: ["g", "r"], description: "Reports" },
      { keys: ["g", "n"], description: "Notifications" },
      { keys: ["g", "s"], description: "Scheduling" },
    ],
  },
  {
    category: "Actions",
    shortcuts: [
      { keys: ["?"], description: "This help" },
      { keys: ["Esc"], description: "Close dialogs" },
    ],
  },
  {
    category: "Code Editor",
    shortcuts: [
      { keys: ["Tab"], description: "Indent" },
      { keys: ["Enter"], description: "New line + auto-indent" },
      { keys: ["Run"], description: "Execute code" },
    ],
  },
];

function KeyBadge({ keyName }: { keyName: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md border border-slate-300 bg-slate-50 text-xs font-mono font-semibold text-slate-700 shadow-sm">
      {keyName}
    </kbd>
  );
}

export function ShortcutHelp() {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger when user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target.isContentEditable) {
        return;
      }

      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }

      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    },
    [open]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {group.category}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-slate-700">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, kidx) => (
                        <span key={kidx} className="flex items-center gap-1">
                          {kidx > 0 && (
                            <span className="text-xs text-slate-400">+</span>
                          )}
                          <KeyBadge keyName={key} />
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
