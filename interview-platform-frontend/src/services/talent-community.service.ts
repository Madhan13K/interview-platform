import api from "@/lib/axios";

export const talentCommunityService = {
  join: async (email: string, name: string, interests: string[]) => {
    const res = await api.post("/api/v1/talent-community/join", { email, name, interests });
    return res.data;
  },

  createEvent: async (data: { title: string; description: string; date: string; type: string }) => {
    const res = await api.post("/api/v1/talent-community/events", data);
    return res.data;
  },

  register: async (eventId: string) => {
    const res = await api.post(`/api/v1/talent-community/events/${eventId}/register`);
    return res.data;
  },

  getMembers: async () => {
    const res = await api.get("/api/v1/talent-community/members");
    return res.data;
  },

  getEvents: async () => {
    const res = await api.get("/api/v1/talent-community/events");
    return res.data;
  },
};
