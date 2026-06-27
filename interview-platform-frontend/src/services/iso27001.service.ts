import api from "@/lib/api";

export const iso27001Service = {
  listPolicies: () => api.get("/api/v1/iso27001/policies"),
  createPolicy: (data: Record<string, unknown>) => api.post("/api/v1/iso27001/policies", data),
  approvePolicy: (id: string) => api.post(`/api/v1/iso27001/policies/${id}/approve`),
  listRisks: () => api.get("/api/v1/iso27001/risks"),
  createRisk: (data: Record<string, unknown>) => api.post("/api/v1/iso27001/risks", data),
  getRiskMatrix: () => api.get("/api/v1/iso27001/risks/matrix"),
  getSOA: () => api.get("/api/v1/iso27001/soa"),
};
