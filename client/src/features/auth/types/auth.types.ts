/* ─────────────────────────────────────────────────────
   DATA CONTRACT  —  matches trade-edge-api
   ─────────────────────────────────────────────────────

   Every API response is wrapped in the standard envelope:
     { success: boolean; message: string; data: T }

   POST /api/auth/register
   Body:    { fullName, email, password, confirmPassword }
   Returns: ApiEnvelope<{ token, user }>   (201)

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

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Inner `data` shape for login/register responses. */
export interface AuthData {
  token: string;
  user: AuthUser;
}
