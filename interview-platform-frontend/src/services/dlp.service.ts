import api from "@/lib/api";

export const dlpService = {
  listPolicies: () => api.get("/api/v1/dlp/policies"),
  createPolicy: (data: Record<string, unknown>) => api.post("/api/v1/dlp/policies", data),
  togglePolicy: (id: string) => api.patch(`/api/v1/dlp/policies/${id}/toggle`),
  scanContent: (content: string) => api.post("/api/v1/dlp/scan", { content }),
  getIncidents: () => api.get("/api/v1/dlp/incidents"),
  getStats: () => api.get("/api/v1/dlp/incidents/stats"),
};
