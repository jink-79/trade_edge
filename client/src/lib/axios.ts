import axios from "axios";
import { TOKEN_KEY, USER_KEY } from "@/features/auth/storage";

/**
 * Single axios instance used by every feature's API layer.
 *
 * VITE_API_URL may be set in client/.env (project root, NOT src/):
 *   VITE_API_URL=http://localhost:5000/api
 * Falls back to the local API when unset.
 *
 * The request interceptor reads the token on every call so it
 * picks up changes (login / logout) without recreating the instance.
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

/* ── attach JWT from localStorage on every outgoing request ── */
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── global response error handling ── */
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      /* Token expired or invalid — clear session and bounce to login.
         Guard against a redirect loop if we're already on /login. */
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export default axiosInstance;
