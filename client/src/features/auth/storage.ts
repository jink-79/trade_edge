import type { AuthUser } from "./types/auth.types";

/**
 * Single source of truth for where the session lives on the client.
 * We standardize on localStorage (stateless JWT) — no cookies.
 *
 * Kept dependency-free so both the axios instance and the auth hooks
 * can import it without creating a circular dependency.
 */

export const TOKEN_KEY = "te_token";
export const USER_KEY = "te_user";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function persistAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
