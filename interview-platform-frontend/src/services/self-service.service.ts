import api from "@/lib/axios";
import { SELF_SERVICE_ENDPOINTS } from "@/lib/api-endpoints";
import type { PreferredSlotResponse, SubmitPreferredSlotsRequest } from "@/types";

export const selfServiceService = {
  submitSlots: async (data: SubmitPreferredSlotsRequest): Promise<PreferredSlotResponse[]> => {
    const res = await api.post(SELF_SERVICE_ENDPOINTS.submitSlots, data);
    return res.data;
  },

  getMySlots: async (): Promise<PreferredSlotResponse[]> => {
    const res = await api.get(SELF_SERVICE_ENDPOINTS.getMySlots);
    return res.data;
  },

  getByInterview: async (interviewId: string): Promise<PreferredSlotResponse[]> => {
    const res = await api.get(SELF_SERVICE_ENDPOINTS.getByInterview(interviewId));
    return res.data;
  },

  getByJobPosition: async (jobPositionId: string): Promise<PreferredSlotResponse[]> => {
    const res = await api.get(SELF_SERVICE_ENDPOINTS.getByJobPosition(jobPositionId));
    return res.data;
  },

  updateSlotStatus: async (slotId: string, status: "ACCEPTED" | "REJECTED"): Promise<void> => {
    await api.patch(SELF_SERVICE_ENDPOINTS.updateSlotStatus(slotId), { status });
  },

  deleteSlot: async (slotId: string): Promise<void> => {
    await api.delete(SELF_SERVICE_ENDPOINTS.deleteSlot(slotId));
  },
};
