import api from "@/lib/axios";

export interface EngagementScore {
  candidateId: string;
  score: number;
  breakdown: {
    emailResponsiveness: number;
    interviewAttendance: number;
    applicationCompleteness: number;
    portalActivity: number;
  };
  lastCalculated: string;
  trend: "UP" | "DOWN" | "STABLE";
}

export const engagementScoringService = {
  getScore: (candidateId: string) => api.get<EngagementScore>(`/api/v1/engagement-scores/${candidateId}`),
  getTopEngaged: (limit: number) => api.get<EngagementScore[]>(`/api/v1/engagement-scores/top?limit=${limit}`),
  recalculate: (candidateId: string) => api.post<EngagementScore>(`/api/v1/engagement-scores/${candidateId}/recalculate`),
};
