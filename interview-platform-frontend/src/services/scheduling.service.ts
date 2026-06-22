import api from "@/lib/axios";
import { SCHEDULING_ENDPOINTS, CALENDAR_ENDPOINTS } from "@/lib/api-endpoints";
import type { AvailabilitySlot, CreateAvailabilityRequest, TimeSuggestion } from "@/types";

export const schedulingService = {
  addAvailability: async (data: CreateAvailabilityRequest): Promise<AvailabilitySlot> => {
    const res = await api.post(SCHEDULING_ENDPOINTS.addAvailability, data);
    return res.data;
  },

  getMyAvailability: async (): Promise<AvailabilitySlot[]> => {
    const res = await api.get(SCHEDULING_ENDPOINTS.getMyAvailability);
    return res.data;
  },

  getUserAvailability: async (userId: string): Promise<AvailabilitySlot[]> => {
    const res = await api.get(SCHEDULING_ENDPOINTS.getUserAvailability(userId));
    return res.data;
  },

  deleteSlot: async (slotId: string): Promise<void> => {
    await api.delete(SCHEDULING_ENDPOINTS.deleteSlot(slotId));
  },

  suggestTimeSlots: async (params: {
    interviewerIds: string[];
    candidateId: string;
    duration: number;
    dateRange: { start: string; end: string };
  }): Promise<TimeSuggestion[]> => {
    const res = await api.post(SCHEDULING_ENDPOINTS.suggest, params);
    return res.data;
  },

  // Calendar endpoints
  addInterviewerAvailability: async (interviewerId: string, data: CreateAvailabilityRequest): Promise<AvailabilitySlot> => {
    const res = await api.post(CALENDAR_ENDPOINTS.addAvailability(interviewerId), data);
    return res.data;
  },

  getInterviewerAvailability: async (interviewerId: string): Promise<AvailabilitySlot[]> => {
    const res = await api.get(CALENDAR_ENDPOINTS.getAvailability(interviewerId));
    return res.data;
  },

  checkAvailability: async (interviewerId: string, date: string): Promise<boolean> => {
    const res = await api.get(CALENDAR_ENDPOINTS.checkAvailability(interviewerId), { params: { date } });
    return res.data;
  },

  deleteInterviewerAvailability: async (interviewerId: string, availabilityId: string): Promise<void> => {
    await api.delete(CALENDAR_ENDPOINTS.deleteAvailability(interviewerId, availabilityId));
  },
};
