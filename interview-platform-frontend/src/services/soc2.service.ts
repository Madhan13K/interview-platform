import api from "@/lib/api";

export const soc2Service = {
  getControls: () => api.get("/api/v1/soc2/controls"),
  getControlsByCategory: (category: string) => api.get(`/api/v1/soc2/controls/${category}`),
  addEvidence: (controlId: string, data: Record<string, unknown>) => api.post(`/api/v1/soc2/controls/${controlId}/evidence`, data),
  runAutomatedCheck: () => api.post("/api/v1/soc2/automated-check"),
  getReadiness: () => api.get("/api/v1/soc2/readiness"),
  getScore: () => api.get("/api/v1/soc2/score"),
};
