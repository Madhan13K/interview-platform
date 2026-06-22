import api from "@/lib/axios";
import { ANALYTICS_ENDPOINTS } from "@/lib/api-endpoints";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Service ─────────────────────────────────────────────────────────────────

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
