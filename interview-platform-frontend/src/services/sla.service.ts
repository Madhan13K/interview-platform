import api from "@/lib/axios";
import { SLA_ENDPOINTS } from "@/lib/api-endpoints";

export interface RecruiterSlaMetrics {
  recruiterId: string;
  recruiterName: string;
  totalInterviews: number;
  completed: number;
  cancelled: number;
  avgResponseTimeHours: number;
  slaTargetHours: number;
  slaBreached: boolean;
  completionRate: number;
}

export const slaService = {
  getMetrics: async (): Promise<RecruiterSlaMetrics[]> => {
    const res = await api.get(SLA_ENDPOINTS.getMetrics);
    return res.data;
  },

  getWorkload: async (): Promise<{ distribution: Record<string, unknown>[]; totalActive: number; averagePerRecruiter: number; overloaded: Record<string, unknown>[] }> => {
    const res = await api.get(SLA_ENDPOINTS.getWorkload);
    return res.data;
  },

  getBottlenecks: async (): Promise<{ stageBottlenecks: Record<string, unknown>[]; awaitingFeedback: number; feedbackSlaDays: number }> => {
    const res = await api.get(SLA_ENDPOINTS.getBottlenecks);
    return res.data;
  },
};
