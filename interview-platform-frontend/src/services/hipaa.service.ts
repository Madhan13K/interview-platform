import api from "@/lib/api";

export const hipaaService = {
  getAuditLog: (params?: { patient?: string; since?: string }) => api.get("/api/v1/hipaa/audit-log", { params }),
  recordConsent: (data: Record<string, unknown>) => api.post("/api/v1/hipaa/consent", data),
  revokeConsent: (id: string) => api.delete(`/api/v1/hipaa/consent/${id}`),
  listBAAs: () => api.get("/api/v1/hipaa/baa"),
  createBAA: (data: Record<string, unknown>) => api.post("/api/v1/hipaa/baa", data),
  runAuditCheck: () => api.post("/api/v1/hipaa/audit-check"),
  getComplianceScore: () => api.get("/api/v1/hipaa/compliance-score"),
};
