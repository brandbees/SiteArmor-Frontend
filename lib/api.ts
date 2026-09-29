import axios from "axios";
import { API_BASE_URL } from "./constants";
import { getToken, clearToken, getAgency } from "./auth";

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

function isClientPortalSession(): boolean {
  return !!getAgency()?.is_client_portal;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const reqUrl = String(error.config?.url || "");
    const isAuthAttempt = /\/auth\/(login|register|verify|resend)/.test(reqUrl);
    const clientPortal = isClientPortalSession();
    const loginPath = clientPortal ? "/client-portal/login" : "/login";

    if (status === 401) {
      // Wrong password on /login returns 401 — do NOT hard-redirect or the inline error vanishes.
      // Agent long jobs can also 401 mid-flight; let the panel toast instead of nuking the session UX.
      if (isAuthAttempt || /\/agent(\/|$)/.test(reqUrl)) {
        return Promise.reject(error);
      }
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = loginPath;
      }
      return Promise.reject(error);
    }
    if (status === 403 && getToken()) {
      // Plan-gate errors (upgrade_required) are handled inline by the page — don't log out.
      if (error.response?.data?.upgrade_required) {
        return Promise.reject(error);
      }
      // Client JWTs hit agency-only routes (settings, announcements, reports) →
      // "Access denied for client portal." Must NOT bounce to agency /login (BUG-034).
      const msg = String(error.response?.data?.error ?? "");
      if (clientPortal || /client portal/i.test(msg)) {
        return Promise.reject(error);
      }
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = `/login?error=${encodeURIComponent(msg || "Access denied.")}`;
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
