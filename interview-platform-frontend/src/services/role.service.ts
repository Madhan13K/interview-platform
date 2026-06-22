import api from "@/lib/axios";
import { ROLE_ENDPOINTS } from "@/lib/api-endpoints";
import type { RoleResponse, CreateRoleRequest, AssignPermissionRequest, RolePermissionResponse } from "@/types/auth";

export const roleService = {
  async getAll(): Promise<RoleResponse[]> {
    const response = await api.get(ROLE_ENDPOINTS.getAll);
    return response.data;
  },

  async getById(roleId: string): Promise<RoleResponse> {
    const response = await api.get(ROLE_ENDPOINTS.getById(roleId));
    return response.data;
  },

  async create(data: CreateRoleRequest): Promise<RoleResponse> {
    const response = await api.post(ROLE_ENDPOINTS.create, data);
    return response.data;
  },

  async delete(roleId: string): Promise<void> {
    await api.delete(ROLE_ENDPOINTS.delete(roleId));
  },

  async assignPermission(roleId: string, data: AssignPermissionRequest): Promise<RolePermissionResponse> {
    const response = await api.post(ROLE_ENDPOINTS.assignPermission(roleId), data);
    return response.data;
  },
};
