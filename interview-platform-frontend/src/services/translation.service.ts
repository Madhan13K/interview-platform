import api from "@/lib/axios";

export const translationService = {
  startSession: async (interviewId: string, source: string, target: string) => {
    const res = await api.post("/api/v1/translation/sessions", { interviewId, source, target });
    return res.data;
  },

  translate: async (sessionId: string, text: string) => {
    const res = await api.post(`/api/v1/translation/sessions/${sessionId}/translate`, { text });
    return res.data;
  },

  end: async (sessionId: string) => {
    const res = await api.post(`/api/v1/translation/sessions/${sessionId}/end`);
    return res.data;
  },

  getLanguages: async () => {
    const res = await api.get("/api/v1/translation/languages");
    return res.data;
  },
};
