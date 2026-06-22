import api from "@/lib/axios";
import { REPORT_ENDPOINTS } from "@/lib/api-endpoints";
import type { AnalyticsReport, ConversionMetrics, TimeToHireMetrics } from "@/types";

export const reportService = {
  getAnalytics: async (): Promise<AnalyticsReport> => {
    const res = await api.get(REPORT_ENDPOINTS.analytics);
    return res.data;
  },

  getInterviewerPerformance: async (interviewerId: string) => {
    const res = await api.get(REPORT_ENDPOINTS.interviewerPerformance(interviewerId));
    return res.data;
  },

  downloadAnalyticsPdf: async (): Promise<Blob> => {
    const res = await api.get(REPORT_ENDPOINTS.pdfAnalytics, { responseType: "blob" });
    return res.data;
  },

  downloadInterviewerPdf: async (interviewerId: string): Promise<Blob> => {
    const res = await api.get(REPORT_ENDPOINTS.pdfInterviewer(interviewerId), { responseType: "blob" });
    return res.data;
  },

  downloadJobPositionPdf: async (jobPositionId: string): Promise<Blob> => {
    const res = await api.get(REPORT_ENDPOINTS.pdfJobPosition(jobPositionId), { responseType: "blob" });
    return res.data;
  },

  getConversionMetrics: async (): Promise<ConversionMetrics> => {
    const res = await api.get(REPORT_ENDPOINTS.conversionMetrics);
    return res.data;
  },

  getTimeToHireMetrics: async (): Promise<TimeToHireMetrics> => {
    const res = await api.get(REPORT_ENDPOINTS.timeToHire);
    return res.data;
  },
};
