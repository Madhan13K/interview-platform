import api from "@/lib/axios";
import { PLAGIARISM_ENDPOINTS } from "@/lib/api-endpoints";

export interface PlagiarismResult {
  verdict: string;
  similarityPercent: number;
  flagged: boolean;
  matches: { corpusIndex: number; similarity: number; commonSections: string[] }[];
}

export const plagiarismService = {
  check: async (code: string, language: string, corpus?: string[]): Promise<PlagiarismResult> => {
    const res = await api.post(PLAGIARISM_ENDPOINTS.check, { code, language, corpus: corpus || [] });
    return res.data;
  },

  compare: async (code1: string, code2: string, language?: string): Promise<{ similarity: number; flagged: boolean }> => {
    const res = await api.post(PLAGIARISM_ENDPOINTS.compare, { code1, code2, language: language || "java" });
    return res.data;
  },
};
