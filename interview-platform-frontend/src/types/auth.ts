// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
}

// ─── User Types ─────────────────────────────────────────────────────────────

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  phoneNumber?: string;
  roles: string[];
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface UpdateUserProfileRequest {
  bio?: string;
  designation?: string;
  company?: string;
  experienceYears?: number;
  linkedinUrl?: string;
  githubUrl?: string;
  resumeUrl?: string;
}

export interface UserProfileResponse {
  id: string;
  bio?: string;
  designation?: string;
  company?: string;
  experienceYears?: number;
  linkedinUrl?: string;
  githubUrl?: string;
}

// ─── Role Types ─────────────────────────────────────────────────────────────

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

// ─── Permission Types ───────────────────────────────────────────────────────

export interface PermissionResponse {
  id: string;
  name: string;
  description?: string;
}

export interface CreatePermissionRequest {
  name: string;
  description?: string;
}

// ─── Role-Permission Types ──────────────────────────────────────────────────

export interface AssignPermissionRequest {
  permissionId: string;
}

export interface AssignRoleRequest {
  roleId: string;
}

export interface RolePermissionResponse {
  id: string;
  roleId: string;
  roleName: string;
  permissionId: string;
  permissionName: string;
  createdAt: string;
}
