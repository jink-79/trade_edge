/* ─────────────────────────────────────────────────────
   DATA CONTRACT  —  matches the API
   ─────────────────────────────────────────────────────

   Every API response is wrapped in the standard envelope:
     { success: boolean; message: string; data: T }

   Sign-ups are closed on the server (single-user app).

   POST /api/auth/login
   Body:    { email, password }
   Returns: ApiEnvelope<{ token, user }>

   GET /api/auth/me   (Authorization: Bearer <token>)
   Returns: ApiEnvelope<AuthUser>
───────────────────────────────────────────────────── */

/** Standard response envelope returned by every endpoint. */
export type { ApiEnvelope } from "@/lib/api";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/** Inner `data` shape for the login response. */
export interface AuthData {
  token: string;
  user: AuthUser;
}
