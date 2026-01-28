import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL, API_ROUTES, API_TIMEOUT } from "@/config/api";
import { useSessionStore } from "@/stores/session-store";
import { getAccessTokenFromCookie } from "@/lib/token-storage";
import { IErrorResponse } from "@/types/api";

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Create axios instance
export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

const failedQueue: {
  resolve: (value: string | null) => void;
  reject: (error: unknown) => void;
}[] = [];

let isRefreshing = false;

const processQueue = (token: string | null, error?: unknown) => {
  while (failedQueue.length) {
    const { resolve, reject } = failedQueue.shift()!;
    if (error) {
      reject(error);
      continue;
    }
    resolve(token);
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = useSessionStore.getState().refreshToken;
  if (!refreshToken) return null;

  const response = await axios.post(
    `${API_BASE_URL}${API_ROUTES.auth.refresh}`,
    { refreshToken },
    {
      timeout: API_TIMEOUT,
      headers: { "Content-Type": "application/json" },
    },
  );

  const payload = response.data?.metadata ?? response.data;
  if (!payload?.accessToken) return null;

  useSessionStore.getState().updateTokens({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  });

  return payload.accessToken as string;
};

// Request interceptor to add auth token
httpClient.interceptors.request.use(
  (config) => {
    const token =
      getAccessTokenFromCookie() ?? useSessionStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for metadata unwrap + error handling
httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data;
    if (data && typeof data === "object" && "metadata" in data) {
      return { ...response, data: data.metadata };
    }
    return response;
  },
  async (error: AxiosError<IErrorResponse>) => {
    if (!error.response) {
      console.error("API Error:", error.message);
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const status = error.response.status;

    const endsWithRoute = (route: string) =>
      typeof originalRequest?.url === "string" &&
      originalRequest.url.endsWith(route);

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !endsWithRoute(API_ROUTES.auth.login) &&
      !endsWithRoute(API_ROUTES.auth.refresh)
    ) {
      if (!useSessionStore.getState().refreshToken) {
        useSessionStore.getState().clearSession();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (!token) {
                reject(error);
                return;
              }
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(httpClient(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(newToken);
        if (!newToken) {
          useSessionStore.getState().clearSession();
          return Promise.reject(error);
        }
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return httpClient(originalRequest);
      } catch (refreshError) {
        processQueue(null, refreshError);
        useSessionStore.getState().clearSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const message = error.response.data?.message || error.response.statusText;
    console.error(`API Error: ${message}`);
    return Promise.reject(error);
  },
);
