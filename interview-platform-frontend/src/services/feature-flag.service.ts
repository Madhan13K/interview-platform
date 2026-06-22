import api from "@/lib/axios";
import { FEATURE_FLAG_ENDPOINTS } from "@/lib/api-endpoints";

export const featureFlagService = {
  getAll: async (): Promise<Record<string, boolean>> => {
    const res = await api.get(FEATURE_FLAG_ENDPOINTS.getAll);
    return res.data;
  },

  getFlag: async (flagKey: string): Promise<{ flag: string; enabled: boolean }> => {
    const res = await api.get(FEATURE_FLAG_ENDPOINTS.getFlag(flagKey));
    return res.data;
  },

  setFlag: async (flagKey: string, enabled: boolean): Promise<{ flag: string; enabled: boolean }> => {
    const res = await api.put(FEATURE_FLAG_ENDPOINTS.setFlag(flagKey), { enabled });
    return res.data;
  },
};
