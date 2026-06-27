import api from "@/lib/axios";

export const collaborativeNotesService = {
  createNote: async (interviewId: string) => {
    const res = await api.post("/api/v1/collaborative-notes", { interviewId });
    return res.data;
  },

  updateNote: async (noteId: string, content: string) => {
    const res = await api.patch(`/api/v1/collaborative-notes/${noteId}`, { content });
    return res.data;
  },

  getNotes: async (interviewId: string) => {
    const res = await api.get(`/api/v1/collaborative-notes/interview/${interviewId}`);
    return res.data;
  },

  subscribe: async (noteId: string) => {
    const res = await api.post(`/api/v1/collaborative-notes/${noteId}/subscribe`);
    return res.data;
  },
};
