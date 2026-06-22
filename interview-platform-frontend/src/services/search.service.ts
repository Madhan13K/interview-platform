import api from "@/lib/axios";
import { SEARCH_ENDPOINTS } from "@/lib/api-endpoints";

export interface SearchResult {
  id: string;
  type: "INTERVIEW" | "USER" | "JOB_POSITION" | "QUESTION" | "DOCUMENT" | "TEAM";
  title: string;
  description?: string;
  url?: string;
  createdAt?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalElements: number;
  page: number;
  size: number;
}

export const searchService = {
  search: async (query: string, type?: string, page = 0, size = 20): Promise<SearchResponse> => {
    const params: Record<string, unknown> = { q: query, page, size };
    if (type) params.type = type;
    const res = await api.get(SEARCH_ENDPOINTS.search, { params });
    return res.data;
  },
};
