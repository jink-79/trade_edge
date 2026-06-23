import axios from "axios";

/**
 * Single axios instance used by every feature's API layer.
 *
 * VITE_API_URL must be set in .env:
 *   VITE_API_URL=http://localhost:5000/api
 *
 * The request interceptor reads the token on every call so it
 * picks up changes (login / logout) without recreating the instance.
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

/* ── attach JWT on every outgoing request ── */
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("te_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── global response error handling ── */
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      /* Token expired or invalid — clear storage and redirect to login */
      localStorage.removeItem("te_token");
      localStorage.removeItem("te_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default axiosInstance;
