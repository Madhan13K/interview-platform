import api from "@/lib/axios";
import { WEBHOOK_ENDPOINTS } from "@/lib/api-endpoints";
import type { WebhookResponse, CreateWebhookRequest, WebhookDelivery, PaginatedResponse } from "@/types";

export const webhookService = {
  create: async (data: CreateWebhookRequest): Promise<WebhookResponse> => {
    const res = await api.post(WEBHOOK_ENDPOINTS.create, data);
    return res.data;
  },

  getAll: async (): Promise<WebhookResponse[]> => {
    const res = await api.get(WEBHOOK_ENDPOINTS.getAll);
    return res.data;
  },

  getById: async (id: string): Promise<WebhookResponse> => {
    const res = await api.get(WEBHOOK_ENDPOINTS.getById(id));
    return res.data;
  },

  update: async (id: string, data: Partial<CreateWebhookRequest> & { active?: boolean }): Promise<WebhookResponse> => {
    const res = await api.put(WEBHOOK_ENDPOINTS.update(id), data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(WEBHOOK_ENDPOINTS.delete(id));
  },

  regenerateSecret: async (id: string): Promise<{ secret: string }> => {
    const res = await api.post(WEBHOOK_ENDPOINTS.regenerateSecret(id));
    return res.data;
  },

  getDeliveries: async (id: string, page = 0, size = 20): Promise<PaginatedResponse<WebhookDelivery>> => {
    const res = await api.get(WEBHOOK_ENDPOINTS.getDeliveries(id), { params: { page, size } });
    return res.data;
  },

  retryDelivery: async (deliveryId: string): Promise<void> => {
    await api.post(WEBHOOK_ENDPOINTS.retryDelivery(deliveryId));
  },
};
