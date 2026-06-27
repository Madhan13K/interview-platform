import api from "@/lib/axios";

export const referenceCheckService = {
  create: async (candidateId: string, name: string, email: string, rel: string) => {
    const res = await api.post("/api/v1/reference-checks", { candidateId, name, email, relationship: rel });
    return res.data;
  },

  send: async (id: string) => {
    const res = await api.post(`/api/v1/reference-checks/${id}/send`);
    return res.data;
  },

  getForCandidate: async (candidateId: string) => {
    const res = await api.get(`/api/v1/reference-checks/candidate/${candidateId}`);
    return res.data;
  },
};
