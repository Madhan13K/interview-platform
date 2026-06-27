import api from "@/lib/axios";

export interface SearchFilters {
  type?: string;
  status?: string;
  dateRange?: { start: string; end: string };
  tags?: string[];
}

export interface SearchFacets {
  types?: boolean;
  statuses?: boolean;
  tags?: boolean;
}

export const smartSearchService = {
  search: async (query: string, filters?: SearchFilters, facets?: SearchFacets) => {
    const res = await api.post("/api/v1/smart-search", { query, filters, facets });
    return res.data;
  },

  saveSearch: async (name: string, params: { query: string; filters?: SearchFilters }) => {
    const res = await api.post("/api/v1/smart-search/saved", { name, params });
    return res.data;
  },

  getSavedSearches: async () => {
    const res = await api.get("/api/v1/smart-search/saved");
    return res.data;
  },

  getSuggestions: async (partial: string) => {
    const res = await api.get("/api/v1/smart-search/suggestions", { params: { q: partial } });
    return res.data;
  },
};
