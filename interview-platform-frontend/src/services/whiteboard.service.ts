import api from "@/lib/axios";
import { WHITEBOARD_ENDPOINTS } from "@/lib/api-endpoints";
import type { WhiteboardSession, WhiteboardStroke } from "@/types";

export const whiteboardService = {
  create: async (interviewId: string): Promise<WhiteboardSession> => {
    const res = await api.post(WHITEBOARD_ENDPOINTS.create, { interviewId });
    return res.data;
  },

  getById: async (id: string): Promise<WhiteboardSession> => {
    const res = await api.get(WHITEBOARD_ENDPOINTS.getById(id));
    return res.data;
  },

  getByInterview: async (interviewId: string): Promise<WhiteboardSession | null> => {
    try {
      const res = await api.get(WHITEBOARD_ENDPOINTS.getByInterview(interviewId));
      return res.data;
    } catch {
      return null;
    }
  },

  addStroke: async (sessionId: string, stroke: Omit<WhiteboardStroke, "id" | "sessionId" | "timestamp">): Promise<WhiteboardStroke> => {
    const res = await api.post(WHITEBOARD_ENDPOINTS.addStroke(sessionId), stroke);
    return res.data;
  },

  getStrokes: async (sessionId: string): Promise<WhiteboardStroke[]> => {
    const res = await api.get(WHITEBOARD_ENDPOINTS.getStrokes(sessionId));
    return res.data;
  },

  saveSnapshot: async (sessionId: string, snapshotData: string): Promise<void> => {
    await api.post(WHITEBOARD_ENDPOINTS.saveSnapshot(sessionId), { snapshotData });
  },

  close: async (sessionId: string): Promise<void> => {
    await api.post(WHITEBOARD_ENDPOINTS.close(sessionId));
  },

  delete: async (sessionId: string): Promise<void> => {
    await api.delete(WHITEBOARD_ENDPOINTS.delete(sessionId));
  },
};
