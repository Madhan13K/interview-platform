import api from "@/lib/axios";
import { USER_ENDPOINTS } from "@/lib/api-endpoints";
import { useAuthStore } from "@/store/auth.store";
import type {
  UserResponse,
  CreateUserRequest,
  UpdateUserProfileRequest,
  UserProfileResponse,
  RoleResponse,
  PermissionResponse,
} from "@/types/auth";

export const userService = {
  /** Get current authenticated user via /me endpoint */
  async getMe(): Promise<UserResponse> {
    const response = await api.get(USER_ENDPOINTS.me);
    const userData = response.data;
    useAuthStore.getState().setUser(userData);
    return userData;
  },

  async create(data: CreateUserRequest): Promise<UserResponse> {
    const response = await api.post(USER_ENDPOINTS.create, data);
    return response.data;
  },

  async getAll(): Promise<UserResponse[]> {
    const response = await api.get(USER_ENDPOINTS.getAll);
    return response.data;
  },

  async getById(userId: string): Promise<UserResponse> {
    const response = await api.get(USER_ENDPOINTS.getById(userId));
    return response.data;
  },

  async update(userId: string, data: Partial<CreateUserRequest>): Promise<UserResponse> {
    const response = await api.put(USER_ENDPOINTS.update(userId), data);
    return response.data;
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(USER_ENDPOINTS.delete(userId));
  },

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const response = await api.get(USER_ENDPOINTS.getProfile(userId));
    return response.data;
  },

  async updateProfile(userId: string, data: UpdateUserProfileRequest): Promise<UserProfileResponse> {
    const response = await api.put(USER_ENDPOINTS.updateProfile(userId), data);
    return response.data;
  },

  async getUserRoles(userId: string): Promise<RoleResponse[]> {
    const response = await api.get(USER_ENDPOINTS.getRoles(userId));
    return response.data;
  },

  async getUserPermissions(userId: string): Promise<PermissionResponse[]> {
    const response = await api.get(USER_ENDPOINTS.getPermissions(userId));
    return response.data;
  },

  async assignRole(userId: string, roleId: string): Promise<void> {
    await api.post(USER_ENDPOINTS.assignRole(userId), { roleId });
  },

  async removeRole(userId: string, roleId: string): Promise<void> {
    await api.delete(USER_ENDPOINTS.removeRole(userId, roleId));
  },

  async changePassword(userId: string, data: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.put(USER_ENDPOINTS.changePassword(userId), data);
  },

  async search(params: { keyword?: string; status?: string; page?: number; size?: number }): Promise<{ content: UserResponse[]; totalElements: number }> {
    const response = await api.get(USER_ENDPOINTS.search, { params });
    return response.data;
  },

  async updateStatus(userId: string, status: string): Promise<void> {
    await api.patch(USER_ENDPOINTS.updateStatus(userId), { status });
  },

  /** Get all available roles in the system */
  async getAllRoles(): Promise<RoleResponse[]> {
    const response = await api.get(USER_ENDPOINTS.getAllRoles);
    return response.data;
  },

  /** Legacy: fetch current user (uses /me now) */
  async fetchCurrentUser(): Promise<UserResponse> {
    return this.getMe();
  },

  /** Shortcut to get roles */
  async getRoles(): Promise<RoleResponse[]> {
    return this.getAllRoles();
  },
};
