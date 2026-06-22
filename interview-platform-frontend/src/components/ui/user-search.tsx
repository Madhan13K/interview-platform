"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/axios";
import { USER_ENDPOINTS } from "@/lib/api-endpoints";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UserResult {
  id: string;
  name: string;
  email: string;
}

interface UserSearchProps {
  onSelect: (user: UserResult) => void;
  placeholder?: string;
  label?: string;
  role?: string;
}

export function UserSearch({
  onSelect,
  placeholder = "Search users by name or email...",
  label,
  role,
}: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setOpen(false);
        return;
      }
      try {
        setLoading(true);
        const params: Record<string, string> = { query: q };
        if (role) params.role = role;
        const res = await api.get(USER_ENDPOINTS.search, { params });
        const data: UserResult[] = Array.isArray(res.data)
          ? res.data
          : res.data.content ?? [];
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    },
    [role]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(user: UserResult) {
    onSelect(user);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
        />
        {loading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <svg
              className="h-4 w-4 animate-spin text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        )}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-y-auto",
            "animate-in fade-in-0 slide-in-from-top-2 duration-150"
          )}
        >
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              className="w-full text-left px-3 py-2.5 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors border-b border-slate-100 last:border-0"
              onClick={() => handleSelect(user)}
            >
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
