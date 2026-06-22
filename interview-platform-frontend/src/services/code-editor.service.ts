import api from "@/lib/axios";
import { CODE_EDITOR_ENDPOINTS } from "@/lib/api-endpoints";
import type { CodeSessionResponse, CodeSnapshotRequest } from "@/types";

export const codeEditorService = {
  startSession: async (interviewId: string, language?: string): Promise<CodeSessionResponse> => {
    const res = await api.post(CODE_EDITOR_ENDPOINTS.start(interviewId), { language });
    return res.data;
  },

  getActiveSession: async (interviewId: string): Promise<CodeSessionResponse | null> => {
    try {
      const res = await api.get(CODE_EDITOR_ENDPOINTS.getActive(interviewId));
      return res.data;
    } catch {
      return null;
    }
  },

  saveCode: async (interviewId: string, data: CodeSnapshotRequest): Promise<void> => {
    await api.put(CODE_EDITOR_ENDPOINTS.save(interviewId), data);
  },

  endSession: async (interviewId: string): Promise<void> => {
    await api.post(CODE_EDITOR_ENDPOINTS.end(interviewId));
  },

  getHistory: async (interviewId: string): Promise<CodeSessionResponse[]> => {
    const res = await api.get(CODE_EDITOR_ENDPOINTS.getHistory(interviewId));
    return res.data;
  },
};
