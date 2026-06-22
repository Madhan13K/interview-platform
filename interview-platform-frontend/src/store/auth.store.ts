import { create } from "zustand";

export interface AuthUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: string;
  phoneNumber?: string;
  roles?: string[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuthTokens: (tokens: {
    accessToken: string | null;
    refreshToken?: string | null;
  }) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// Hydrate from localStorage on init
const getStoredTokens = () => {
  if (typeof window === "undefined") return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem("access_token"),
    refreshToken: localStorage.getItem("refresh_token"),
  };
};

const getStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...getStoredTokens(),
  user: getStoredUser(),

  setAuthTokens: ({ accessToken, refreshToken = null }) => {
    if (typeof window !== "undefined") {
      if (accessToken) {
        localStorage.setItem("access_token", accessToken);
      } else {
        localStorage.removeItem("access_token");
      }
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      } else {
        localStorage.removeItem("refresh_token");
      }
    }
    set({ accessToken, refreshToken });
  },

  setUser: (user) => {
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
    }
    set({ user });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
    set({ accessToken: null, refreshToken: null, user: null });
  },

  isAuthenticated: () => !!get().accessToken,
}));
