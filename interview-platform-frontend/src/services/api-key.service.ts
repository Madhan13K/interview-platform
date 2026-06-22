import api from "@/lib/axios";
import { API_KEY_ENDPOINTS } from "@/lib/api-endpoints";
import type { ApiKeyResponse, CreateApiKeyRequest, ApiKeyCreatedResponse } from "@/types";

export const apiKeyService = {
  create: async (data: CreateApiKeyRequest): Promise<ApiKeyCreatedResponse> => {
    const res = await api.post(API_KEY_ENDPOINTS.create, data);
    return res.data;
  },

  getAll: async (): Promise<ApiKeyResponse[]> => {
    const res = await api.get(API_KEY_ENDPOINTS.getAll);
    return res.data;
  },

  revoke: async (id: string): Promise<void> => {
    await api.delete(API_KEY_ENDPOINTS.revoke(id));
  },
};
