import api from "@/lib/axios";

export const aiInterviewerService = {
  createSession: async (jobId: string, candidateId: string) => {
    const res = await api.post("/api/v1/ai-interviewer/sessions", { jobId, candidateId });
    return res.data;
  },

  getNextQuestion: async (sessionId: string) => {
    const res = await api.get(`/api/v1/ai-interviewer/sessions/${sessionId}/next-question`);
    return res.data;
  },

  submitResponse: async (sessionId: string, response: string) => {
    const res = await api.post(`/api/v1/ai-interviewer/sessions/${sessionId}/respond`, { response });
    return res.data;
  },

  complete: async (sessionId: string) => {
    const res = await api.post(`/api/v1/ai-interviewer/sessions/${sessionId}/complete`);
    return res.data;
  },
};
