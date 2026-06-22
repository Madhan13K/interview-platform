import api from "@/lib/axios";
import { AUTH_ENDPOINTS } from "@/lib/api-endpoints";
import { useAuthStore } from "@/store/auth.store";
import type { AuthResponse, LoginRequest, SignupRequest, GoogleLoginRequest } from "@/types/auth";

const mapAuthResponse = (payload: unknown): AuthResponse => {
  const parsed = payload as Record<string, unknown>;
  return {
    accessToken: (parsed.accessToken as string) ?? (parsed.access_token as string) ?? "",
    refreshToken: (parsed.refreshToken as string) ?? (parsed.refresh_token as string) ?? undefined,
  };
};

const persistAuth = (auth: AuthResponse) => {
  useAuthStore.getState().setAuthTokens({
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken ?? null,
  });
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post(AUTH_ENDPOINTS.login, data);
  const auth = mapAuthResponse(response.data);
  persistAuth(auth);
  return auth;
};

export const signup = async (data: SignupRequest): Promise<AuthResponse> => {
  const response = await api.post(AUTH_ENDPOINTS.signup, data);
  const auth = mapAuthResponse(response.data);
  persistAuth(auth);
  return auth;
};

export const googleLogin = async (data: GoogleLoginRequest): Promise<AuthResponse> => {
  const response = await api.post(AUTH_ENDPOINTS.google, data);
  const auth = mapAuthResponse(response.data);
  persistAuth(auth);
  return auth;
};

export const handleOAuthCallback = (params: URLSearchParams): AuthResponse => {
  const accessToken = params.get("access_token") ?? params.get("accessToken") ?? "";
  const refreshToken = params.get("refresh_token") ?? params.get("refreshToken") ?? undefined;
  const auth: AuthResponse = { accessToken, refreshToken };
  persistAuth(auth);
  return auth;
};

export const refreshAccessToken = async (): Promise<AuthResponse> => {
  const currentRefreshToken = useAuthStore.getState().refreshToken;
  const response = await api.post(AUTH_ENDPOINTS.refresh, {
    refreshToken: currentRefreshToken,
  });
  const auth = mapAuthResponse(response.data);
  persistAuth({
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken ?? currentRefreshToken ?? undefined,
  });
  return auth;
};

export const logout = async (): Promise<void> => {
  try {
    await api.post(AUTH_ENDPOINTS.logout);
  } finally {
    useAuthStore.getState().logout();
  }
};
