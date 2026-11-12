import axiosInstance from "@/lib/axios";
import type { ApiEnvelope } from "@/lib/api";
import type {
  Account,
  AccountDetail,
  CreateAccountPayload,
  UpdateAccountPayload,
  UpsertSnapshotPayload,
} from "../types/accounts.types";

export async function fetchAccounts(): Promise<Account[]> {
  const { data } = await axiosInstance.get<ApiEnvelope<Account[]>>("/accounts");
  return data.data;
}

export async function fetchAccount(id: string): Promise<AccountDetail> {
  const { data } = await axiosInstance.get<ApiEnvelope<AccountDetail>>(`/accounts/${id}`);
  return data.data;
}

export async function createAccount(payload: CreateAccountPayload): Promise<AccountDetail> {
  const { data } = await axiosInstance.post<ApiEnvelope<AccountDetail>>("/accounts", payload);
  return data.data;
}

export async function updateAccount(id: string, payload: UpdateAccountPayload): Promise<AccountDetail> {
  const { data } = await axiosInstance.patch<ApiEnvelope<AccountDetail>>(`/accounts/${id}`, payload);
  return data.data;
}

export async function deleteAccount(id: string): Promise<void> {
  await axiosInstance.delete(`/accounts/${id}`);
}

export async function upsertSnapshot(
  id: string,
  month: string,
  payload: UpsertSnapshotPayload,
): Promise<AccountDetail> {
  const { data } = await axiosInstance.put<ApiEnvelope<AccountDetail>>(
    `/accounts/${id}/snapshots/${month}`,
    payload,
  );
  return data.data;
}

export async function deleteSnapshot(id: string, month: string): Promise<AccountDetail> {
  const { data } = await axiosInstance.delete<ApiEnvelope<AccountDetail>>(
    `/accounts/${id}/snapshots/${month}`,
  );
  return data.data;
}
