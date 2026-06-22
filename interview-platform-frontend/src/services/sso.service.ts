import api from "@/lib/axios";
import { SSO_ENDPOINTS } from "@/lib/api-endpoints";

export interface SsoConfiguration {
  id: string;
  tenantId: string;
  providerType: "OKTA" | "ONELOGIN" | "AZURE_AD" | "CUSTOM";
  entityId: string;
  metadataUrl?: string;
  certificate?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSsoConfigRequest {
  tenantId: string;
  providerType: "OKTA" | "ONELOGIN" | "AZURE_AD" | "CUSTOM";
  entityId: string;
  metadataUrl?: string;
  certificate?: string;
  enabled?: boolean;
}

export interface UpdateSsoConfigRequest {
  providerType?: "OKTA" | "ONELOGIN" | "AZURE_AD" | "CUSTOM";
  entityId?: string;
  metadataUrl?: string;
  certificate?: string;
  enabled?: boolean;
}

export interface SsoLoginUrl {
  providerType: string;
  loginUrl: string;
}

export const ssoService = {
  create: async (data: CreateSsoConfigRequest): Promise<SsoConfiguration> => {
    const res = await api.post(SSO_ENDPOINTS.create, data);
    return res.data;
  },

  update: async (configId: string, data: UpdateSsoConfigRequest): Promise<SsoConfiguration> => {
    const res = await api.put(SSO_ENDPOINTS.update(configId), data);
    return res.data;
  },

  getById: async (configId: string): Promise<SsoConfiguration> => {
    const res = await api.get(SSO_ENDPOINTS.getById(configId));
    return res.data;
  },

  getByTenant: async (tenantId: string): Promise<SsoConfiguration[]> => {
    const res = await api.get(SSO_ENDPOINTS.getByTenant(tenantId));
    return res.data;
  },

  toggle: async (configId: string): Promise<SsoConfiguration> => {
    const res = await api.patch(SSO_ENDPOINTS.toggle(configId));
    return res.data;
  },

  delete: async (configId: string): Promise<void> => {
    await api.delete(SSO_ENDPOINTS.delete(configId));
  },

  getLoginUrls: async (tenantId: string): Promise<SsoLoginUrl[]> => {
    const res = await api.get(SSO_ENDPOINTS.getLoginUrls(tenantId));
    return res.data;
  },
};
