import api from "@/lib/axios";

export interface CostEntry {
  category: string;
  amount: number;
  jobId: string;
  description?: string;
}

export const costPerHireService = {
  addCost: async (data: CostEntry) => {
    const res = await api.post("/api/v1/cost-per-hire", data);
    return res.data;
  },

  getCostsForPosition: async (jobId: string) => {
    const res = await api.get(`/api/v1/cost-per-hire/position/${jobId}`);
    return res.data;
  },

  getAvgCost: async () => {
    const res = await api.get("/api/v1/cost-per-hire/average");
    return res.data;
  },

  getBreakdown: async (since: string) => {
    const res = await api.get("/api/v1/cost-per-hire/breakdown", { params: { since } });
    return res.data;
  },
};
