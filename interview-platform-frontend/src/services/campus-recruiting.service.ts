import api from "@/lib/api";

export const campusRecruitingService = {
  listEvents: () => api.get("/api/v1/campus-recruiting/events"),
  createEvent: (data: Record<string, unknown>) => api.post("/api/v1/campus-recruiting/events", data),
  registerCandidate: (eventId: string, candidateId: string) => api.post(`/api/v1/campus-recruiting/events/${eventId}/register`, { candidateId }),
  getCohort: (tag: string) => api.get(`/api/v1/campus-recruiting/cohort/${tag}`),
};
