import api from "@/lib/axios";
import { TEAM_ENDPOINTS } from "@/lib/api-endpoints";
import type { TeamResponse, CreateTeamRequest } from "@/types";

export const teamService = {
  create: async (data: CreateTeamRequest): Promise<TeamResponse> => {
    const res = await api.post(TEAM_ENDPOINTS.create, data);
    return res.data;
  },

  getById: async (id: string): Promise<TeamResponse> => {
    const res = await api.get(TEAM_ENDPOINTS.getById(id));
    return res.data;
  },

  getAll: async (): Promise<TeamResponse[]> => {
    const res = await api.get(TEAM_ENDPOINTS.getAll);
    return res.data;
  },

  getByDepartment: async (department: string): Promise<TeamResponse[]> => {
    const res = await api.get(TEAM_ENDPOINTS.getByDepartment(department));
    return res.data;
  },

  getMy: async (): Promise<TeamResponse[]> => {
    const res = await api.get(TEAM_ENDPOINTS.getMy);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateTeamRequest>): Promise<TeamResponse> => {
    const res = await api.put(TEAM_ENDPOINTS.update(id), data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(TEAM_ENDPOINTS.delete(id));
  },

  addMember: async (teamId: string, userId: string): Promise<void> => {
    await api.post(TEAM_ENDPOINTS.addMember(teamId, userId));
  },

  removeMember: async (teamId: string, userId: string): Promise<void> => {
    await api.delete(TEAM_ENDPOINTS.removeMember(teamId, userId));
  },

  updateMemberRole: async (teamId: string, userId: string, role: string): Promise<void> => {
    await api.patch(TEAM_ENDPOINTS.updateMemberRole(teamId, userId), { role });
  },
};
