import api from "@/lib/axios";

export const aiChatWidgetService = {
  sendMessage: async (message: string, context?: { page?: string; entityId?: string }) => {
    const res = await api.post("/api/v1/ai-chat/message", { message, context });
    return res.data;
  },

  getHistory: async () => {
    const res = await api.get("/api/v1/ai-chat/history");
    return res.data;
  },

  clearHistory: async () => {
    const res = await api.delete("/api/v1/ai-chat/history");
    return res.data;
  },
};
