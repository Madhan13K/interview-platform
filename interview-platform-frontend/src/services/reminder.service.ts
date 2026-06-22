import api from "@/lib/axios";
import { REMINDER_ENDPOINTS } from "@/lib/api-endpoints";
import type { ReminderResponse } from "@/types";

export const reminderService = {
  create: async (interviewId: string, data: { type: "EMAIL" | "SMS" | "IN_APP"; scheduledAt: string }): Promise<ReminderResponse> => {
    const res = await api.post(REMINDER_ENDPOINTS.create(interviewId), data);
    return res.data;
  },

  cancel: async (interviewId: string): Promise<void> => {
    await api.delete(REMINDER_ENDPOINTS.cancel(interviewId));
  },

  getByInterview: async (interviewId: string): Promise<ReminderResponse[]> => {
    const res = await api.get(REMINDER_ENDPOINTS.getByInterview(interviewId));
    return res.data;
  },

  getMy: async (): Promise<ReminderResponse[]> => {
    const res = await api.get(REMINDER_ENDPOINTS.getMy);
    return res.data;
  },
};
