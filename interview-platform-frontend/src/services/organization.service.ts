import api from "@/lib/axios";
import { ORGANIZATION_ENDPOINTS } from "@/lib/api-endpoints";
import type { OrganizationResponse, CreateOrganizationRequest, OrganizationMember } from "@/types";

export const organizationService = {
  create: async (data: CreateOrganizationRequest): Promise<OrganizationResponse> => {
    const res = await api.post(ORGANIZATION_ENDPOINTS.create, data);
    return res.data;
  },

  getById: async (id: string): Promise<OrganizationResponse> => {
    const res = await api.get(ORGANIZATION_ENDPOINTS.getById(id));
    return res.data;
  },

  update: async (id: string, data: Partial<CreateOrganizationRequest>): Promise<OrganizationResponse> => {
    const res = await api.put(ORGANIZATION_ENDPOINTS.update(id), data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(ORGANIZATION_ENDPOINTS.delete(id));
  },

  getMy: async (): Promise<OrganizationResponse[]> => {
    const res = await api.get(ORGANIZATION_ENDPOINTS.getMy);
    return res.data;
  },

  addMember: async (orgId: string, data: { userId: string; role: string }): Promise<void> => {
    await api.post(ORGANIZATION_ENDPOINTS.addMember(orgId), data);
  },

  removeMember: async (orgId: string, userId: string): Promise<void> => {
    await api.delete(ORGANIZATION_ENDPOINTS.removeMember(orgId, userId));
  },

  getMembers: async (orgId: string): Promise<OrganizationMember[]> => {
    const res = await api.get(ORGANIZATION_ENDPOINTS.getMembers(orgId));
    return res.data;
  },

  updateMemberRole: async (orgId: string, userId: string, role: string): Promise<void> => {
    await api.patch(ORGANIZATION_ENDPOINTS.updateMemberRole(orgId, userId), { role });
  },
};
