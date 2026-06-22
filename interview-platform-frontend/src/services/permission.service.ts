import api from "@/lib/axios";
import { PERMISSION_ENDPOINTS } from "@/lib/api-endpoints";
import type { PermissionResponse, CreatePermissionRequest } from "@/types/auth";

export const permissionService = {
  async getAll(): Promise<PermissionResponse[]> {
    const response = await api.get(PERMISSION_ENDPOINTS.getAll);
    return response.data;
  },

  async getById(permissionId: string): Promise<PermissionResponse> {
    const response = await api.get(PERMISSION_ENDPOINTS.getById(permissionId));
    return response.data;
  },

  async create(data: CreatePermissionRequest): Promise<PermissionResponse> {
    const response = await api.post(PERMISSION_ENDPOINTS.create, data);
    return response.data;
  },

  async delete(permissionId: string): Promise<void> {
    await api.delete(PERMISSION_ENDPOINTS.delete(permissionId));
  },
};
