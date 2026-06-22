import api from "@/lib/axios";
import { NOTIFICATION_ENDPOINTS } from "@/lib/api-endpoints";
import type { NotificationResponse, NotificationCount, PaginatedResponse } from "@/types";

export const notificationService = {
  getAll: async (page = 0, size = 20): Promise<PaginatedResponse<NotificationResponse>> => {
    const res = await api.get(NOTIFICATION_ENDPOINTS.getAll, { params: { page, size } });
    return res.data;
  },

  getUnread: async (): Promise<NotificationResponse[]> => {
    const res = await api.get(NOTIFICATION_ENDPOINTS.getUnread);
    return res.data;
  },

  getUnreadCount: async (): Promise<NotificationCount> => {
    const res = await api.get(NOTIFICATION_ENDPOINTS.getCount);
    return res.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(NOTIFICATION_ENDPOINTS.markRead(id));
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch(NOTIFICATION_ENDPOINTS.markAllRead);
  },
};
