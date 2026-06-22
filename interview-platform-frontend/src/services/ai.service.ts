import api from "@/lib/axios";
import { AI_ENDPOINTS } from "@/lib/api-endpoints";
import type { AISuggestionRequest, AISuggestionResponse, AIResumeParseResponse, PaginatedResponse } from "@/types";

export const aiService = {
  suggestQuestions: async (data: AISuggestionRequest): Promise<AISuggestionResponse[]> => {
    const res = await api.post(AI_ENDPOINTS.suggestQuestions, data);
    return res.data;
  },

  /** Parse resume from text */
  parseResume: async (resumeText: string): Promise<AIResumeParseResponse> => {
    const res = await api.post(AI_ENDPOINTS.parseResume, { resumeText });
    return res.data;
  },

  /** Parse resume from PDF file upload */
  parseResumeFile: async (file: File): Promise<AIResumeParseResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post(AI_ENDPOINTS.parseResume, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  generateInterviewSummary: async (interviewId: string) => {
    const res = await api.post(AI_ENDPOINTS.interviewSummary, { interviewId });
    return res.data;
  },

  getSuggestions: async (page = 0, size = 10): Promise<PaginatedResponse<AISuggestionResponse>> => {
    const res = await api.get(AI_ENDPOINTS.getSuggestions, { params: { page, size } });
    return res.data;
  },

  getSuggestionsByInterview: async (interviewId: string): Promise<AISuggestionResponse[]> => {
    const res = await api.get(AI_ENDPOINTS.getSuggestionsByInterview(interviewId));
    return res.data;
  },

  updateSuggestionStatus: async (id: string, status: "ACCEPTED" | "REJECTED"): Promise<void> => {
    await api.patch(AI_ENDPOINTS.updateSuggestionStatus(id), { status });
  },
};
