import api from "@/lib/axios";

export interface DebriefSession {
  id: string;
  interviewId: string;
  participants: string[];
  anonymousMode: boolean;
  status: "PENDING" | "IN_PROGRESS" | "CALIBRATING" | "COMPLETED";
  createdAt: string;
}

export interface DebriefVote {
  participantId: string;
  rating: number;
  recommendation: string;
  notes: string;
  submittedAt: string;
}

export interface DebriefResult {
  sessionId: string;
  averageRating: number;
  votes: DebriefVote[];
  consensus: string;
  calibrationNotes: string | null;
}

export const debriefService = {
  create: (data: { interviewId: string; participants: string[]; anonymousMode?: boolean }) => api.post<DebriefSession>("/api/v1/debrief", data),
  submitVote: (sessionId: string, data: { rating: number; recommendation: string; notes: string }) => api.post(`/api/v1/debrief/${sessionId}/vote`, data),
  calibrate: (sessionId: string) => api.post(`/api/v1/debrief/${sessionId}/calibrate`),
  getResults: (sessionId: string) => api.get<DebriefResult>(`/api/v1/debrief/${sessionId}`),
};
