import type { AxiosError, InternalAxiosRequestConfig } from "axios";

import api from "@/lib/axios";
import { refreshAccessToken } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

let isInterceptorAttached = false;

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const setupAxiosInterceptors = () => {
  if (isInterceptorAttached) {
	return;
  }

  api.interceptors.request.use((config) => {
	const token = useAuthStore.getState().accessToken;
	if (token) {
	  config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
  });

  api.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
	  const originalRequest = error.config as RetriableRequestConfig | undefined;

	  if (!originalRequest || originalRequest._retry || error.response?.status !== 401) {
		return Promise.reject(error);
	  }

	  originalRequest._retry = true;

	  try {
		const refreshed = await refreshAccessToken();
		originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
		return api(originalRequest);
	  } catch (refreshError) {
		useAuthStore.getState().logout();
		return Promise.reject(refreshError);
	  }
	},
  );

  isInterceptorAttached = true;
};

