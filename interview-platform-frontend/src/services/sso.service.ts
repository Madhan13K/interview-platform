import api from "@/lib/axios";
import { SSO_ENDPOINTS, SSO_URLS } from "@/lib/api-endpoints";

export type SsoProviderType = "OKTA" | "KEYCLOAK" | "ONELOGIN" | "AZURE_AD" | "GENERIC_SAML";

export interface SsoConfiguration {
  id: string;
  tenantId: string;
  registrationId: string;
  displayName: string;
  providerType: SsoProviderType;
  idpEntityId: string;
  idpSsoUrl: string;
  idpSloUrl?: string;
  metadataUrl?: string;
  spEntityId: string;
  acsUrl: string;
  nameIdFormat?: string;
  signRequests: boolean;
  enabled: boolean;
  autoProvisionUsers: boolean;
  defaultRole: string;
  emailAttribute?: string;
  firstNameAttribute?: string;
  lastNameAttribute?: string;
  createdAt: string;
  updatedAt?: string;
  spMetadataUrl: string;
  loginUrl: string;
}

export interface CreateSsoConfigRequest {
  tenantId: string;
  displayName: string;
  providerType: SsoProviderType;
  idpEntityId: string;
  idpSsoUrl: string;
  idpSloUrl?: string;
  idpCertificate: string;
  metadataUrl?: string;
  spEntityId?: string;
  nameIdFormat?: string;
  signRequests?: boolean;
  autoProvisionUsers?: boolean;
  defaultRole?: string;
  emailAttribute?: string;
  firstNameAttribute?: string;
  lastNameAttribute?: string;
}

export interface UpdateSsoConfigRequest {
  displayName?: string;
  idpEntityId?: string;
  idpSsoUrl?: string;
  idpSloUrl?: string;
  idpCertificate?: string;
  metadataUrl?: string;
  spEntityId?: string;
  nameIdFormat?: string;
  signRequests?: boolean;
  autoProvisionUsers?: boolean;
  defaultRole?: string;
  emailAttribute?: string;
  firstNameAttribute?: string;
  lastNameAttribute?: string;
}

export interface SsoProviderInfo {
  primary: { provider: string; name: string; loginUrl: string };
  fallback?: { provider: string; name: string; loginUrl: string };
  note: string;
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

  toggle: async (configId: string, enabled: boolean): Promise<SsoConfiguration> => {
    const res = await api.patch(`${SSO_ENDPOINTS.toggle(configId)}?enabled=${enabled}`);
    return res.data;
  },

  delete: async (configId: string): Promise<void> => {
    await api.delete(SSO_ENDPOINTS.delete(configId));
  },

  getLoginUrls: async (tenantId: string): Promise<SsoConfiguration[]> => {
    const res = await api.get(SSO_ENDPOINTS.getLoginUrls(tenantId));
    return res.data;
  },

  /** Get SSO provider info (Okta primary + Keycloak fallback) */
  getProviders: async (): Promise<SsoProviderInfo> => {
    const res = await api.get(SSO_ENDPOINTS.providers);
    return res.data;
  },

  /** Initiate SSO login (Okta OIDC primary - auto-fallback to Keycloak on failure) */
  loginWithSso: (): void => {
    window.location.href = SSO_URLS.login;
  },

  /** Manually initiate Keycloak fallback login */
  loginWithKeycloak: (): void => {
    window.location.href = SSO_URLS.fallback;
  },
};
