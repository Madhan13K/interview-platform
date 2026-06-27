import api from "@/lib/axios";

export const interviewIntelligenceService = {
  getInsights: async (orgId: string) => {
    const res = await api.get(`/api/v1/interview-intelligence/insights/${orgId}`);
    return res.data;
  },

  getFailurePoints: async () => {
    const res = await api.get("/api/v1/interview-intelligence/failure-points");
    return res.data;
  },

  getBestQuestions: async () => {
    const res = await api.get("/api/v1/interview-intelligence/best-questions");
    return res.data;
  },

  getDropOff: async () => {
    const res = await api.get("/api/v1/interview-intelligence/drop-off");
    return res.data;
  },
};
