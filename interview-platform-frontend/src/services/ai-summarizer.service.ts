import api from "@/lib/axios";

export const aiSummarizerService = {
  generate: async (interviewId: string) => {
    const res = await api.post("/api/v1/ai-summarizer/generate", { interviewId });
    return res.data;
  },

  get: async (interviewId: string) => {
    const res = await api.get(`/api/v1/ai-summarizer/${interviewId}`);
    return res.data;
  },

  distribute: async (id: string) => {
    const res = await api.post(`/api/v1/ai-summarizer/${id}/distribute`);
    return res.data;
  },
};
