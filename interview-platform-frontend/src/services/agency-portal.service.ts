import api from "@/lib/api";

export const agencyPortalService = {
  listAgencies: () => api.get("/api/v1/agency-portal/agencies"),
  createAgency: (data: Record<string, unknown>) => api.post("/api/v1/agency-portal/agencies", data),
  submitCandidate: (data: { agencyId: string; candidateId: string; jobPositionId: string }) => api.post("/api/v1/agency-portal/submissions", data),
  reviewSubmission: (id: string, status: string) => api.patch(`/api/v1/agency-portal/submissions/${id}`, { status }),
  getPerformance: (agencyId: string) => api.get(`/api/v1/agency-portal/agencies/${agencyId}/performance`),
};
