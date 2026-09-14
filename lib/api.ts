import axios from "axios";
import { API_BASE_URL } from "./constants";
import { getToken, clearToken } from "./auth";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const reqUrl = String(error.config?.url || "");
    const isAuthAttempt = /\/auth\/(login|register|verify|resend)/.test(reqUrl);

    if (status === 401) {
      // Wrong password on /login returns 401 — do NOT hard-redirect or the inline error vanishes.
      // Agent long jobs can also 401 mid-flight; let the panel toast instead of nuking the session UX.
      if (isAuthAttempt || /\/agent(\/|$)/.test(reqUrl)) {
        return Promise.reject(error);
      }
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    if (status === 403 && getToken()) {
      // Plan-gate errors (upgrade_required) are handled inline by the page — don't log out.
      if (error.response?.data?.upgrade_required) {
        return Promise.reject(error);
      }
      // Only redirect when mid-session (had a valid token). If no token, the
      // 403 came from the login endpoint itself — let the catch block handle it.
      clearToken();
      if (typeof window !== "undefined") {
        const msg = error.response?.data?.error ?? "Access denied.";
        window.location.href = `/login?error=${encodeURIComponent(msg)}`;
      }
    }
    if (status === 503 && error.response?.data?.maintenance === true) {
      if (typeof window !== "undefined") {
        window.location.href = "/maintenance";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
