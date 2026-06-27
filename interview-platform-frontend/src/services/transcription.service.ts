import api from "@/lib/axios";

export interface TranscriptionSegment {
  id: string;
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface TranscriptionSession {
  id: string;
  interviewId: string;
  status: "ACTIVE" | "COMPLETED" | "FAILED";
  provider: string;
  language: string;
  segments: TranscriptionSegment[];
  createdAt: string;
  completedAt: string | null;
}

export const transcriptionService = {
  start: (data: { interviewId: string; provider?: string; language?: string }) => api.post<TranscriptionSession>("/api/v1/transcription/start", data),
  end: (sessionId: string) => api.post<TranscriptionSession>(`/api/v1/transcription/${sessionId}/end`),
  get: (sessionId: string) => api.get<TranscriptionSession>(`/api/v1/transcription/${sessionId}`),
  getByInterview: (interviewId: string) => api.get<TranscriptionSession>(`/api/v1/transcription/interview/${interviewId}`),
  getSegments: (sessionId: string) => api.get<TranscriptionSegment[]>(`/api/v1/transcription/${sessionId}/segments`),
  score: (sessionId: string) => api.post(`/api/v1/transcription/${sessionId}/score`),
};
