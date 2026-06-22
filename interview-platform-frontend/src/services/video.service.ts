import api from "@/lib/axios";
import { VIDEO_ENDPOINTS } from "@/lib/api-endpoints";
import type { VideoRecordingResponse } from "@/types";

export const videoService = {
  startRecording: async (interviewId: string): Promise<VideoRecordingResponse> => {
    const res = await api.post(VIDEO_ENDPOINTS.start, { interviewId });
    return res.data;
  },

  completeRecording: async (id: string, data: { duration: number; fileSize: number; url: string }): Promise<VideoRecordingResponse> => {
    const res = await api.post(VIDEO_ENDPOINTS.complete(id), data);
    return res.data;
  },

  failRecording: async (id: string, reason?: string): Promise<void> => {
    await api.post(VIDEO_ENDPOINTS.fail(id), { reason });
  },

  getByInterview: async (interviewId: string): Promise<VideoRecordingResponse[]> => {
    const res = await api.get(VIDEO_ENDPOINTS.getByInterview(interviewId));
    return res.data;
  },

  getById: async (id: string): Promise<VideoRecordingResponse> => {
    const res = await api.get(VIDEO_ENDPOINTS.getById(id));
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(VIDEO_ENDPOINTS.delete(id));
  },

  getMy: async (): Promise<VideoRecordingResponse[]> => {
    const res = await api.get(VIDEO_ENDPOINTS.getMy);
    return res.data;
  },
};
