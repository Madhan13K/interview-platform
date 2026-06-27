import api from "@/lib/axios";

export interface WebAuthnCredential {
  id: string;
  name: string;
  authenticatorType: "platform" | "cross-platform";
  createdAt: string;
  lastUsedAt: string | null;
  enabled: boolean;
}

export const webauthnService = {
  startRegistration: (data: { credentialName: string; authenticatorType: "platform" | "cross-platform" }) => api.post("/api/v1/webauthn/register/start", data),
  finishRegistration: (data: Record<string, unknown>) => api.post("/api/v1/webauthn/register/finish", data),
  startAuthentication: (email: string) => api.post("/api/v1/webauthn/authenticate/start", { email }),
  finishAuthentication: (data: Record<string, unknown>) => api.post("/api/v1/webauthn/authenticate/finish", data),
  getCredentials: () => api.get<WebAuthnCredential[]>("/api/v1/webauthn/credentials"),
  deleteCredential: (id: string) => api.delete(`/api/v1/webauthn/credentials/${id}`),
  toggleCredential: (id: string, enabled: boolean) => api.patch(`/api/v1/webauthn/credentials/${id}/toggle?enabled=${enabled}`),
};
