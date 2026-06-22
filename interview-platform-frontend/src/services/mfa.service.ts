import api from "@/lib/axios";
import { MFA_ENDPOINTS } from "@/lib/api-endpoints";
import type { MFASetupResponse } from "@/types";

export const mfaService = {
  setup: async (): Promise<MFASetupResponse> => {
    const res = await api.post(MFA_ENDPOINTS.setup);
    return res.data;
  },

  verify: async (code: string): Promise<{ backupCodes: string[] }> => {
    const res = await api.post(MFA_ENDPOINTS.verify, { code });
    return res.data;
  },

  validate: async (code: string): Promise<{ valid: boolean }> => {
    const res = await api.post(MFA_ENDPOINTS.validate, { code });
    return res.data;
  },

  disable: async (): Promise<void> => {
    await api.delete(MFA_ENDPOINTS.disable);
  },

  regenerateBackupCodes: async (): Promise<{ backupCodes: string[] }> => {
    const res = await api.post(MFA_ENDPOINTS.regenerateBackupCodes);
    return res.data;
  },
};
