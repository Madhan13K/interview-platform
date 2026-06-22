import api from "@/lib/axios";
import { BACKGROUND_CHECK_ENDPOINTS } from "@/lib/api-endpoints";

export interface BackgroundCheckResult {
  checkId: string | null;
  status: string;
  provider: string;
  errorMessage: string | null;
}

export const backgroundCheckService = {
  initiate: async (data: { candidateEmail: string; candidateName: string; packageType?: string }): Promise<BackgroundCheckResult> => {
    const res = await api.post(BACKGROUND_CHECK_ENDPOINTS.initiate, data);
    return res.data;
  },

  getStatus: async (checkId: string): Promise<BackgroundCheckResult> => {
    const res = await api.get(BACKGROUND_CHECK_ENDPOINTS.getStatus(checkId));
    return res.data;
  },
};
