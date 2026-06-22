import api from "@/lib/axios";
import { ACTIVITY_ENDPOINTS } from "@/lib/api-endpoints";
import type { ActivityResponse, PaginatedResponse } from "@/types";

export const activityService = {
  getAll: async (page = 0, size = 20): Promise<PaginatedResponse<ActivityResponse>> => {
    const res = await api.get(ACTIVITY_ENDPOINTS.getAll, { params: { page, size } });
    return res.data;
  },

  getByEntity: async (entityType: string, entityId: string): Promise<ActivityResponse[]> => {
    const res = await api.get(ACTIVITY_ENDPOINTS.getByEntity(entityType, entityId));
    return res.data;
  },

  getByUser: async (userId: string): Promise<ActivityResponse[]> => {
    const res = await api.get(ACTIVITY_ENDPOINTS.getByUser(userId));
    return res.data;
  },

  getMy: async (): Promise<ActivityResponse[]> => {
    const res = await api.get(ACTIVITY_ENDPOINTS.getMy);
    return res.data;
  },

  filter: async (filters: { entityType?: string; action?: string; startDate?: string; endDate?: string }): Promise<ActivityResponse[]> => {
    const res = await api.post(ACTIVITY_ENDPOINTS.filter, filters);
    return res.data;
  },
};
