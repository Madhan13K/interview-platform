import api from "@/lib/axios";

export interface SearchResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface InterviewSearchResult {
  id: string;
  title: string;
  description: string;
  status: string;
  type: string;
  candidate: { id: string; name: string; email: string } | null;
  startTime: string;
  createdAt: string;
}

export interface CandidateSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  status: string;
  skills: string[];
  company: string;
}

export const searchInterviews = async (query: string, page = 0, size = 20): Promise<SearchResult<InterviewSearchResult>> => {
  const res = await api.get("/api/v1/search/interviews", { params: { query, page, size } });
  return res.data;
};

export const searchCandidates = async (query: string, page = 0, size = 20): Promise<SearchResult<CandidateSearchResult>> => {
  const res = await api.get("/api/v1/search/candidates", { params: { query, page, size } });
  return res.data;
};

export const triggerReindex = async (): Promise<string> => {
  const res = await api.post("/api/v1/search/reindex");
  return res.data;
};
