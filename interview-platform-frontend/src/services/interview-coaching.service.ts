import api from "@/lib/api";

export const interviewCoachingService = {
  startMock: (data: { jobTitle: string; interviewType: string }) => api.post("/api/v1/interview-coaching/start", data),
  getQuestion: (sessionId: string) => api.post(`/api/v1/interview-coaching/${sessionId}/question`),
  submitAnswer: (sessionId: string, answer: string) => api.post(`/api/v1/interview-coaching/${sessionId}/answer`, { answer }),
  complete: (sessionId: string) => api.post(`/api/v1/interview-coaching/${sessionId}/complete`),
  getHistory: () => api.get("/api/v1/interview-coaching/history"),
};
