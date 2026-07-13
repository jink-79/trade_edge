import axiosInstance from "@/lib/axios";
import type {
  ApiEnvelope,
  AuthData,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "../types/auth.types";

/**
 * POST /auth/login — returns the token + user (unwrapped from the envelope).
 */
export async function loginApi(payload: LoginPayload): Promise<AuthData> {
  const { data } = await axiosInstance.post<ApiEnvelope<AuthData>>(
    "/auth/login",
    payload,
  );
  return data.data;
}

/**
 * POST /auth/register — creates the account and returns a fresh session.
 */
export async function registerApi(
  payload: RegisterPayload,
): Promise<AuthData> {
  const { data } = await axiosInstance.post<ApiEnvelope<AuthData>>(
    "/auth/register",
    payload,
  );
  return data.data;
}

/**
 * GET /auth/me — validates the stored token and returns the current user.
 * The Bearer token is attached automatically by the axios interceptor.
 */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await axiosInstance.get<ApiEnvelope<AuthUser>>("/auth/me");
  return data.data;
}
