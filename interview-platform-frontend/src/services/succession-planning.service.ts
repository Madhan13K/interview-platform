import api from "@/lib/api";

export const successionPlanningService = {
  list: () => api.get("/api/v1/succession-plans"),
  create: (data: Record<string, unknown>) => api.post("/api/v1/succession-plans", data),
  addSuccessor: (planId: string, data: Record<string, unknown>) => api.post(`/api/v1/succession-plans/${planId}/successors`, data),
  getHighRisk: () => api.get("/api/v1/succession-plans/high-risk"),
};
