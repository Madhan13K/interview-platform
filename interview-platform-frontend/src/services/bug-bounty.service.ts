import api from "@/lib/api";

export const bugBountyService = {
  getProgram: () => api.get("/api/v1/bug-bounty/program"),
  createProgram: (data: Record<string, unknown>) => api.post("/api/v1/bug-bounty/program", data),
  listSubmissions: () => api.get("/api/v1/bug-bounty/submissions"),
  submitReport: (data: { title: string; severity: string; description: string; stepsToReproduce: string }) => api.post("/api/v1/bug-bounty/submissions", data),
  triageSubmission: (id: string, status: string) => api.patch(`/api/v1/bug-bounty/submissions/${id}/triage`, { status }),
  getStats: () => api.get("/api/v1/bug-bounty/stats"),
};
