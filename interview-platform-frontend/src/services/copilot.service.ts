import api from "@/lib/axios";

export interface CopilotSuggestion {
  type: "FOLLOW_UP_QUESTION" | "BIAS_ALERT" | "TIME_WARNING" | "COMPETENCY_GAP" | "POSITIVE_SIGNAL";
  content: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  timestamp: string;
}

export interface CopilotDashboard {
  sessionId: string;
  interviewProgress: number;
  timeElapsedMin: number;
  timeRemainingMin: number;
  currentScores: Record<string, number>;
  recentSuggestions: CopilotSuggestion[];
  competencyCoverage: Record<string, boolean>;
  biasAlerts: string[];
  nextRecommendedTopic: string;
}

export const copilotService = {
  start: (data: { interviewId: string; competencies: string[]; totalMinutes: number }) => api.post("/api/v1/copilot/start", data),
  update: (sessionId: string, data: { newText: string; elapsedMinutes: number }) => api.post(`/api/v1/copilot/${sessionId}/update`, data),
  dashboard: (sessionId: string) => api.get<CopilotDashboard>(`/api/v1/copilot/${sessionId}/dashboard`),
  end: (sessionId: string) => api.post(`/api/v1/copilot/${sessionId}/end`),
};
