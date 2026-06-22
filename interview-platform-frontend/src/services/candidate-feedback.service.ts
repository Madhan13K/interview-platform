import api from "@/lib/axios";
import { CANDIDATE_FEEDBACK_ENDPOINTS } from "@/lib/api-endpoints";
import type { CandidateFeedbackResponse, SubmitCandidateFeedbackRequest } from "@/types";

export const candidateFeedbackService = {
  submit: async (data: SubmitCandidateFeedbackRequest): Promise<CandidateFeedbackResponse> => {
    const res = await api.post(CANDIDATE_FEEDBACK_ENDPOINTS.submit, data);
    return res.data;
  },

  getByInterview: async (interviewId: string): Promise<CandidateFeedbackResponse[]> => {
    const res = await api.get(CANDIDATE_FEEDBACK_ENDPOINTS.getByInterview(interviewId));
    return res.data;
  },

  getSummary: async (): Promise<{ averageOverall: number; averageInterviewer: number; averageProcess: number; totalResponses: number }> => {
    const res = await api.get(CANDIDATE_FEEDBACK_ENDPOINTS.getSummary);
    return res.data;
  },

  getMy: async (): Promise<CandidateFeedbackResponse[]> => {
    const res = await api.get(CANDIDATE_FEEDBACK_ENDPOINTS.getMy);
    return res.data;
  },
};
