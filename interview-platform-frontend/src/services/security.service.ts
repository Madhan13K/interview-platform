import api from "@/lib/axios";
import { SECURITY_ENDPOINTS } from "@/lib/api-endpoints";

export interface AccountLockout {
  id: string;
  email: string;
  failedAttempts: number;
  locked: boolean;
  lockedAt?: string;
  lockExpiresAt?: string;
}

export interface IpBlockEntry {
  id: string;
  ipAddress: string;
  reason: string;
  blockedBy: string;
  blockedAt: string;
  expiresAt?: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  successful: boolean;
  failureReason?: string;
  attemptedAt: string;
}

export interface BlockIpRequest {
  ipAddress: string;
  reason: string;
  expiresAt?: string;
}

export const securityService = {
  getLockoutStatus: async (email: string): Promise<AccountLockout> => {
    const res = await api.get(SECURITY_ENDPOINTS.getLockoutStatus(email));
    return res.data;
  },

  unlockAccount: async (email: string): Promise<void> => {
    await api.post(SECURITY_ENDPOINTS.unlockAccount(email));
  },

  getBlockedIps: async (): Promise<IpBlockEntry[]> => {
    const res = await api.get(SECURITY_ENDPOINTS.getBlockedIps);
    return res.data;
  },

  blockIp: async (data: BlockIpRequest): Promise<IpBlockEntry> => {
    const res = await api.post(SECURITY_ENDPOINTS.blockIp, data);
    return res.data;
  },

  unblockIp: async (ipAddress: string): Promise<void> => {
    await api.post(SECURITY_ENDPOINTS.unblockIp(ipAddress));
  },

  getLoginAttempts: async (email: string): Promise<LoginAttempt[]> => {
    const res = await api.get(SECURITY_ENDPOINTS.getLoginAttempts(email));
    return res.data;
  },
};
