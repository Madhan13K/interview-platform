import api from "@/lib/axios";
import { ANALYTICS_ENDPOINTS } from "@/lib/api-endpoints";

// ─── Legacy Types (used by leaderboard, etc.) ────────────────────────────────

export interface CohortData {
  period: string;
  totalCandidates: number;
  hired: number;
  rejected: number;
  pending: number;
  conversionRate: number;
}

export interface LeaderboardEntry {
  interviewerId: string;
  interviewerName: string;
  totalInterviews: number;
  avgRating: number;
  hireRate: number;
  rank: number;
}

export interface RealtimeMetrics {
  activeInterviews: number;
  onlineUsers: number;
  scheduledToday: number;
  completedToday: number;
  avgDuration: number;
}

export interface RetentionData {
  period: string;
  candidatesEntered: number;
  candidatesRetained: number;
  retentionRate: number;
}

export const analyticsService = {
  getCohorts: async (startDate?: string, endDate?: string): Promise<CohortData[]> => {
    const res = await api.get(ANALYTICS_ENDPOINTS.cohorts, {
      params: { startDate, endDate },
    });
    return res.data;
  },

  getLeaderboard: async (period?: string): Promise<LeaderboardEntry[]> => {
    const res = await api.get(ANALYTICS_ENDPOINTS.leaderboard, {
      params: { period },
    });
    return res.data;
  },

  getRealtime: async (): Promise<RealtimeMetrics> => {
    const res = await api.get(ANALYTICS_ENDPOINTS.realtime);
    return res.data;
  },

  getRetention: async (period?: string): Promise<RetentionData[]> => {
    const res = await api.get(ANALYTICS_ENDPOINTS.retention, {
      params: { period },
    });
    return res.data;
  },
};

// ─── New Analytics Types & API ───────────────────────────────────────────────

export interface HiringPrediction {
  candidateId: string;
  successProbability: number;
  recommendation: string;
  confidence: number;
  features: Record<string, number>;
  topFactors: string[];
  predictedTimeToOffer: number;
}

export interface FunnelOverview {
  totalCandidates: number;
  totalHired: number;
  totalRejected: number;
  overallConversion: number;
  avgTimeToHire: number;
  stageBreakdown: { stage: string; count: number }[];
  conversionRates: Record<string, number>;
}

export const getFunnelOverview = async (periodType = "MONTHLY"): Promise<FunnelOverview> => {
  const res = await api.get("/api/v1/analytics/funnel", { params: { periodType } });
  return res.data;
};

export const predictHiringSuccess = async (candidateId: string): Promise<HiringPrediction> => {
  const res = await api.get(`/api/v1/analytics/predict/${candidateId}`);
  return res.data;
};

export const getModelMetrics = async () => {
  const res = await api.get("/api/v1/analytics/model/metrics");
  return res.data;
};

export const triggerComputation = async (): Promise<string> => {
  const res = await api.post("/api/v1/analytics/compute");
  return res.data;
};
