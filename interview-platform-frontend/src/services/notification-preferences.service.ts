import api from "@/lib/axios";

export interface NotificationChannel {
  email: boolean;
  inApp: boolean;
  push: boolean;
  sms: boolean;
}

export interface NotificationPreference {
  category: string;
  label: string;
  description: string;
  channels: NotificationChannel;
}

export interface NotificationPreferences {
  userId: string;
  preferences: NotificationPreference[];
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  digestFrequency: "REALTIME" | "HOURLY" | "DAILY" | "WEEKLY";
}

export const notificationPreferencesService = {
  get: () => api.get<NotificationPreferences>("/api/v1/notification-preferences"),
  update: (data: Partial<NotificationPreferences>) => api.put<NotificationPreferences>("/api/v1/notification-preferences", data),
  updateCategory: (category: string, channels: NotificationChannel) => api.put<NotificationPreference>(`/api/v1/notification-preferences/${category}`, { channels }),
  resetToDefaults: () => api.post<NotificationPreferences>("/api/v1/notification-preferences/reset"),
};
