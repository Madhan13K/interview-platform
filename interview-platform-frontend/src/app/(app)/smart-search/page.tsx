"use client";

import { useState, useEffect, useCallback } from "react";
import { smartSearchService, SearchFilters } from "@/services/smart-search.service";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  score: number;
  highlights: string[];
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  createdAt: string;
}

interface Facet {
  key: string;
  values: { label: string; count: number }[];
}

export default function SmartSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [facets, setFacets] = useState<Facet[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    smartSearchService.getSavedSearches()
      .then((s) => setSavedSearches(s || []))
      .catch(() => setSavedSearches([]));
  }, []);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setShowSuggestions(false);
    try {
      const res = await smartSearchService.search(q, filters, { types: true, statuses: true, tags: true });
      setResults(res?.results || []);
      setFacets(res?.facets || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback(async (value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      const s = await smartSearchService.getSuggestions(value).catch(() => []);
      setSuggestions(s || []);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, []);

  const handleSaveSearch = async () => {
    if (!query.trim()) return;
    const name = prompt("Name for this saved search:");
    if (name) {
      await smartSearchService.saveSearch(name, { query, filters });
      const s = await smartSearchService.getSavedSearches();
      setSavedSearches(s || []);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Smart Search</h1>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search candidates, jobs, interviews..."
              className="w-full border rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(s); setShowSuggestions(false); handleSearch(s); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Searching..." : "Search"}
          </button>
          <button
            onClick={handleSaveSearch}
            className="px-4 py-3 border rounded-lg hover:bg-slate-50 transition"
            title="Save search"
          >
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Facets Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Filters</h3>
            {facets.map((facet) => (
              <div key={facet.key} className="mb-3">
                <p className="text-sm font-medium text-slate-600 mb-1 capitalize">{facet.key}</p>
                {facet.values.map((v) => (
                  <label key={v.label} className="flex items-center gap-2 text-sm py-0.5">
                    <input type="checkbox" className="rounded" />
                    <span>{v.label}</span>
                    <span className="text-slate-400 ml-auto">({v.count})</span>
                  </label>
                ))}
              </div>
            ))}
            {facets.length === 0 && <p className="text-sm text-slate-400">Search to see filters</p>}
          </div>

          {/* Saved Searches */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Saved Searches</h3>
            <div className="space-y-2">
              {savedSearches.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setQuery(s.query); handleSearch(s.query); }}
                  className="w-full text-left text-sm px-2 py-1 rounded hover:bg-slate-50"
                >
                  {s.name}
                </button>
              ))}
              {savedSearches.length === 0 && <p className="text-xs text-slate-400">No saved searches</p>}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-3">
          {results.map((r) => (
            <div key={r.id} className="bg-white rounded-lg border p-4 hover:shadow-sm transition">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium capitalize">{r.type}</span>
                  <h3 className="font-semibold mt-1">{r.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{r.description}</p>
                </div>
                <span className="text-sm text-slate-400">{(r.score * 100).toFixed(0)}% match</span>
              </div>
            </div>
          ))}
          {results.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-400">Enter a search query to find results.</div>
          )}
        </div>
      </div>
    </div>
  );
}
