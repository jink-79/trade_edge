/**
 * Central environment config.
 *
 * Resolves the API base URL from the build mode so the app "just works":
 *   - `npm run dev`   (local)     -> http://localhost:5000/api
 *   - `npm run build` (deployed)  -> https://trade-edge-backend.vercel.app/api
 *
 * You can override either one by setting `VITE_API_URL` in a `.env` file
 * (e.g. `.env.local` to point local dev at a staging backend).
 */

const LOCAL_API_URL = "http://localhost:5000/api";
const PROD_API_URL = "https://trade-edge-backend.vercel.app/api";

const resolvedApiUrl =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? PROD_API_URL : LOCAL_API_URL);

export const env = {
  /** Base URL for all API requests (already includes the `/api` prefix). */
  apiUrl: resolvedApiUrl,
  /** True during a production build (`npm run build`). */
  isProd: import.meta.env.PROD,
  /** True during local dev (`npm run dev`). */
  isDev: import.meta.env.DEV,
  /** Vite mode string: "development" | "production" | custom. */
  mode: import.meta.env.MODE,
} as const;

export type Env = typeof env;
