import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { loginApi, logoutApi } from "../api/auth-api";
import type { LoginPayload, AuthUser } from "../types/auth.types";

const TOKEN_KEY = "te_token";
const USER_KEY = "te_user";

/* ── helpers ── */

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

function persistAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/* ── hook ── */

export function useLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await loginApi(payload);
      persistAuth(token, user);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}.`);
      navigate("/");
    } catch (err: any) {
      /* axios puts the server message in err.response.data.message */
      const msg =
        err?.response?.data?.message ??
        "Invalid email or password. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}

export function useLogout() {
  const navigate = useNavigate();

  return async () => {
    try {
      await logoutApi();
    } catch {
      /* best-effort — clear locally regardless */
    } finally {
      clearAuth();
      navigate("/login");
    }
  };
}
