import api from "@/lib/axios";
import { DASHBOARD_ENDPOINTS } from "@/lib/api-endpoints";
import { useAuthStore } from "@/store/auth.store";
import type { AdminDashboardStats, InterviewerDashboardStats, CandidateDashboardStats } from "@/types";

export const dashboardService = {
  getAdminStats: async (): Promise<AdminDashboardStats> => {
    const res = await api.get(DASHBOARD_ENDPOINTS.admin);
    return res.data;
  },

  getInterviewerStats: async (): Promise<InterviewerDashboardStats> => {
    const res = await api.get(DASHBOARD_ENDPOINTS.interviewer);
    return res.data;
  },

  getInterviewerStatsById: async (id: string): Promise<InterviewerDashboardStats> => {
    const res = await api.get(DASHBOARD_ENDPOINTS.interviewerById(id));
    return res.data;
  },

  getCandidateStats: async (): Promise<CandidateDashboardStats> => {
    const res = await api.get(DASHBOARD_ENDPOINTS.candidate);
    return res.data;
  },

  /**
   * Smart fetch - tries endpoints based on user's roles.
   * Falls back gracefully if access is denied.
   */
  getMyStats: async (): Promise<AdminDashboardStats | InterviewerDashboardStats | CandidateDashboardStats | null> => {
    const user = useAuthStore.getState().user;
    const roles = user?.roles?.map(r => r.toUpperCase()) ?? [];

    // Try admin first if user has admin/recruiter role
    if (roles.includes("ADMIN") || roles.includes("RECRUITER")) {
      try {
        const res = await api.get(DASHBOARD_ENDPOINTS.admin);
        return res.data;
      } catch { /* fall through */ }
    }

    // Try interviewer
    if (roles.includes("INTERVIEWER")) {
      try {
        const res = await api.get(DASHBOARD_ENDPOINTS.interviewer);
        return res.data;
      } catch { /* fall through */ }
    }

    // Try candidate
    try {
      const res = await api.get(DASHBOARD_ENDPOINTS.candidate);
      return res.data;
    } catch { /* fall through */ }

    // Try all endpoints in order as last resort
    try {
      const res = await api.get(DASHBOARD_ENDPOINTS.admin);
      return res.data;
    } catch {
      try {
        const res = await api.get(DASHBOARD_ENDPOINTS.interviewer);
        return res.data;
      } catch {
        try {
          const res = await api.get(DASHBOARD_ENDPOINTS.candidate);
          return res.data;
        } catch {
          return null;
        }
      }
    }
  },

  // Legacy aliases
  getStats: async () => {
    return dashboardService.getMyStats();
  },
};
