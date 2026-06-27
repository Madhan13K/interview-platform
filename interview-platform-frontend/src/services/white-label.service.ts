import api from "@/lib/api";

export const whiteLabelService = {
  getConfig: (orgId: string) => api.get(`/api/v1/white-label/${orgId}`),
  updateConfig: (orgId: string, data: Record<string, unknown>) => api.put(`/api/v1/white-label/${orgId}`, data),
  deleteConfig: (orgId: string) => api.delete(`/api/v1/white-label/${orgId}`),
  resolveFromDomain: () => api.get("/api/v1/white-label/resolve"),
};
