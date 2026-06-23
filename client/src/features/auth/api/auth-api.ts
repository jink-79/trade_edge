import axiosInstance from "@/lib/axios";
import type {
  LoginPayload,
  SignupPayload,
  AuthResponse,
} from "../types/auth.types";

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await axiosInstance.post<AuthResponse>(
    "/auth/login",
    payload,
  );
  return data;
}

export async function signupApi(payload: SignupPayload): Promise<AuthResponse> {
  const { data } = await axiosInstance.post<AuthResponse>(
    "/auth/signup",
    payload,
  );
  return data;
}

export async function logoutApi(): Promise<void> {
  await axiosInstance.post("/auth/logout");
}
