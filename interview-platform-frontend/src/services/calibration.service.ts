import api from "@/lib/axios";

export const calibrationService = {
  getReport: async (interviewerId: string) => {
    const res = await api.get(`/api/v1/calibration/report/${interviewerId}`);
    return res.data;
  },

  compare: async (interviewerIds: string[]) => {
    const res = await api.post("/api/v1/calibration/compare", { interviewerIds });
    return res.data;
  },

  detectBias: async (interviewerId: string) => {
    const res = await api.get(`/api/v1/calibration/bias/${interviewerId}`);
    return res.data;
  },

  getOrgCalibration: async () => {
    const res = await api.get("/api/v1/calibration/org");
    return res.data;
  },
};
