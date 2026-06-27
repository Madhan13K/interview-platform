import api from "@/lib/axios";

export const proctoringService = {
  start: async (interviewId: string, candidateId: string, consent: boolean) => {
    const res = await api.post("/api/v1/proctoring/start", { interviewId, candidateId, consent });
    return res.data;
  },

  reportTabSwitch: async (id: string) => {
    const res = await api.post(`/api/v1/proctoring/${id}/tab-switch`);
    return res.data;
  },

  reportFaceViolation: async (id: string, count: number) => {
    const res = await api.post(`/api/v1/proctoring/${id}/face-violation`, { count });
    return res.data;
  },

  end: async (id: string) => {
    const res = await api.post(`/api/v1/proctoring/${id}/end`);
    return res.data;
  },

  getFlagged: async () => {
    const res = await api.get("/api/v1/proctoring/flagged");
    return res.data;
  },
};
