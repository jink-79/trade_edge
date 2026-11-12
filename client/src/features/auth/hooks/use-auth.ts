import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { loginApi, fetchCurrentUser } from "../api/auth-api";
import {
  getStoredToken,
  getStoredUser,
  persistAuth,
  clearAuth,
} from "../storage";
import type { LoginPayload } from "../types/auth.types";

/* Re-export storage helpers so existing imports from this hook keep working. */
export { getStoredToken, getStoredUser } from "../storage";

/* ── login ── */

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await loginApi(payload);
      persistAuth(token, user);
      queryClient.setQueryData(["auth", "me"], user);
      toast.success(`Welcome back, ${user.fullName.split(" ")[0]}.`);
      navigate("/");
    } catch (err) {
      const msg =
        (isAxiosError(err) ? err.response?.data?.message : undefined) ??
        "Invalid email or password. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}

/* ── logout (stateless JWT — client-side only) ── */

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    clearAuth();
    queryClient.removeQueries({ queryKey: ["auth", "me"] });
    navigate("/login");
  };
}

/* ── current user (validates the stored token against GET /auth/me) ── */

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    enabled: Boolean(getStoredToken()),
    initialData: () => getStoredUser() ?? undefined,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
