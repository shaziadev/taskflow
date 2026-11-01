/**
 * Axios instance shared by the whole app.
 *
 * - Adds the JWT access token to every request.
 * - When the API answers 401 (access token expired), it calls /auth/refresh/
 *   once, stores the new token and retries the original request.
 *   Concurrent 401s wait for the same refresh call instead of each refreshing.
 */
import axios from "axios";

import { tokenStorage } from "./tokenStorage";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const access = tokenStorage.getAccess();
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) throw new Error("No refresh token");
  // Plain axios (not `api`) so this call doesn't go through the interceptors.
  const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
  tokenStorage.set(data.access, data.refresh ?? refresh);
  return data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes("/auth/");
    if (error.response?.status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const access = await refreshPromise;
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch (refreshError) {
        tokenStorage.clear();
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(refreshError);
      } finally {
        refreshPromise = null;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
