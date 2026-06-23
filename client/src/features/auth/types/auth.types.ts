/* ─────────────────────────────────────────────────────
   DATA CONTRACT
   ─────────────────────────────────────────────────────

   POST /api/auth/login
   Body:    { email: string; password: string }
   Returns: { token: string; user: AuthUser }

   POST /api/auth/signup
   Body:    { name: string; email: string; password: string }
   Returns: { token: string; user: AuthUser }

   POST /api/auth/logout
   Headers: Authorization: Bearer <token>
   Returns: { success: boolean }
───────────────────────────────────────────────────── */

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

/* stored in localStorage */
export interface StoredAuth {
  token: string;
  user: AuthUser;
}
