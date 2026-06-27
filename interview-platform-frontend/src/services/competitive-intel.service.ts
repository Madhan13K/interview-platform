import api from "@/lib/axios";

export interface CompetitiveIntelEntry {
  competitor: string;
  role: string;
  salaryMin: number;
  salaryMax: number;
  benefits: string[];
  source: string;
}

export const competitiveIntelService = {
  add: async (data: CompetitiveIntelEntry) => {
    const res = await api.post("/api/v1/competitive-intel", data);
    return res.data;
  },

  getByCompetitor: async (name: string) => {
    const res = await api.get(`/api/v1/competitive-intel/competitor/${name}`);
    return res.data;
  },

  compareSalaries: async (role: string, location: string) => {
    const res = await api.get("/api/v1/competitive-intel/salaries", { params: { role, location } });
    return res.data;
  },

  getTrends: async (competitor: string) => {
    const res = await api.get(`/api/v1/competitive-intel/trends/${competitor}`);
    return res.data;
  },
};
