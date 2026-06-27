import api from "@/lib/axios";

export const mlScoringService = {
  train: async (orgId: string) => {
    const res = await api.post("/api/v1/ml-scoring/train", { orgId });
    return res.data;
  },

  predict: async (candidateId: string, jobId: string) => {
    const res = await api.post("/api/v1/ml-scoring/predict", { candidateId, jobId });
    return res.data;
  },

  getMetrics: async () => {
    const res = await api.get("/api/v1/ml-scoring/metrics");
    return res.data;
  },

  getTopPredictions: async (jobId: string, limit: number) => {
    const res = await api.get(`/api/v1/ml-scoring/top-predictions/${jobId}`, { params: { limit } });
    return res.data;
  },
};
