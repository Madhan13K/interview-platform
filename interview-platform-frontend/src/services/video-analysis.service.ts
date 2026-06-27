import api from "@/lib/axios";

export interface VideoAnalysisResult {
  id: string;
  interviewId: string;
  candidateId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  sentimentScore: number;
  engagementScore: number;
  confidenceScore: number;
  emotions: Record<string, number>;
  createdAt: string;
  completedAt: string | null;
}

export interface VideoTimelineEntry {
  timestamp: number;
  sentiment: number;
  engagement: number;
  dominantEmotion: string;
  flags: string[];
}

export const videoAnalysisService = {
  submit: (data: { interviewId: string; videoUrl: string; candidateId: string }) => api.post<VideoAnalysisResult>("/api/v1/video-analysis/submit", data),
  get: (id: string) => api.get<VideoAnalysisResult>(`/api/v1/video-analysis/${id}`),
  getByInterview: (interviewId: string) => api.get<VideoAnalysisResult>(`/api/v1/video-analysis/interview/${interviewId}`),
  getTimeline: (id: string) => api.get<VideoTimelineEntry[]>(`/api/v1/video-analysis/${id}/timeline`),
};
