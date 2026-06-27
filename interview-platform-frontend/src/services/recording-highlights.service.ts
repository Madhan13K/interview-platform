import api from "@/lib/axios";

export interface RecordingHighlight {
  id: string;
  interviewId: string;
  startTime: number;
  endTime: number;
  label: string;
  type: "KEY_MOMENT" | "RED_FLAG" | "STRONG_ANSWER" | "FOLLOW_UP_NEEDED" | "BOOKMARK";
  confidence: number;
  transcript: string;
  createdAt: string;
  createdBy: string | null;
}

export const recordingHighlightsService = {
  generate: (interviewId: string) => api.post<RecordingHighlight[]>(`/api/v1/recording-highlights/generate`, { interviewId }),
  listByInterview: (interviewId: string) => api.get<RecordingHighlight[]>(`/api/v1/recording-highlights/interview/${interviewId}`),
  bookmark: (data: { interviewId: string; startTime: number; endTime: number; label: string }) => api.post<RecordingHighlight>("/api/v1/recording-highlights/bookmark", data),
  delete: (id: string) => api.delete(`/api/v1/recording-highlights/${id}`),
  update: (id: string, data: { label?: string; type?: string }) => api.put<RecordingHighlight>(`/api/v1/recording-highlights/${id}`, data),
};
