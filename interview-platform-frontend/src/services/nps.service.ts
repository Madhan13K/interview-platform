import api from "@/lib/axios";

export const npsService = {
  send: async (interviewId: string, candidateId: string) => {
    const res = await api.post("/api/v1/nps/send", { interviewId, candidateId });
    return res.data;
  },

  respond: async (surveyId: string, score: number, feedback: string) => {
    const res = await api.post(`/api/v1/nps/${surveyId}/respond`, { score, feedback });
    return res.data;
  },

  getTrends: async (orgId: string) => {
    const res = await api.get(`/api/v1/nps/trends/${orgId}`);
    return res.data;
  },

  getCorrelation: async (orgId: string) => {
    const res = await api.get(`/api/v1/nps/correlation/${orgId}`);
    return res.data;
  },
};
