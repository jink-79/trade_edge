import axios from "axios";
import { env } from "@/config/env";
import { TOKEN_KEY, USER_KEY } from "@/features/auth/storage";

/**
 * Single axios instance used by every feature's API layer.
 *
 * The base URL is resolved by @/config/env — localhost in dev, the Vercel
 * backend in a production build (overridable via VITE_API_URL).
 *
 * The request interceptor reads the token on every call so it
 * picks up changes (login / logout) without recreating the instance.
 */
const axiosInstance = axios.create({
  baseURL: env.apiUrl,
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
