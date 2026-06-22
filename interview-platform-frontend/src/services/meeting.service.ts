import api from "@/lib/axios";
import { MEETING_ENDPOINTS } from "@/lib/api-endpoints";
import type { MeetingResponse } from "@/types";

export const meetingService = {
  generate: async (interviewId: string): Promise<MeetingResponse> => {
    const res = await api.post(MEETING_ENDPOINTS.generate(interviewId));
    return res.data;
  },

  get: async (interviewId: string): Promise<MeetingResponse | null> => {
    try {
      const res = await api.get(MEETING_ENDPOINTS.get(interviewId));
      return res.data;
    } catch {
      return null;
    }
  },
};
