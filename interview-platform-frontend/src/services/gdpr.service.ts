import api from "@/lib/axios";
import { GDPR_ENDPOINTS } from "@/lib/api-endpoints";
import type { ConsentResponse, ErasureRequest } from "@/types";

export const gdprService = {
  recordConsent: async (consentType: string, granted: boolean): Promise<ConsentResponse> => {
    const res = await api.post(GDPR_ENDPOINTS.recordConsent, { consentType, granted });
    return res.data;
  },

  getConsents: async (): Promise<ConsentResponse[]> => {
    const res = await api.get(GDPR_ENDPOINTS.getConsents);
    return res.data;
  },

  revokeConsent: async (consentType: string): Promise<void> => {
    await api.delete(GDPR_ENDPOINTS.revokeConsent(consentType));
  },

  exportData: async (): Promise<Blob> => {
    const res = await api.get(GDPR_ENDPOINTS.exportData, { responseType: "blob" });
    return res.data;
  },

  requestErasure: async (reason?: string): Promise<void> => {
    await api.post(GDPR_ENDPOINTS.requestErasure, { reason });
  },

  getErasureRequests: async (): Promise<ErasureRequest[]> => {
    const res = await api.get(GDPR_ENDPOINTS.getErasureRequests);
    return res.data;
  },

  processErasure: async (requestId: string, approved: boolean): Promise<void> => {
    await api.post(GDPR_ENDPOINTS.processErasure(requestId), { approved });
  },
};
