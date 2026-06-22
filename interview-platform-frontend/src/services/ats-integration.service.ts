import api from "@/lib/axios";
import { ATS_ENDPOINTS } from "@/lib/api-endpoints";

export const atsIntegrationService = {
  syncCandidates: async (provider: string): Promise<Record<string, unknown>[]> => {
    const res = await api.post(ATS_ENDPOINTS.syncCandidates(provider));
    return res.data;
  },

  pushCandidate: async (provider: string, candidateData: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const res = await api.post(ATS_ENDPOINTS.pushCandidate(provider), candidateData);
    return res.data;
  },
};
