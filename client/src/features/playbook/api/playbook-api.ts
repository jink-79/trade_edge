import axiosInstance from "@/lib/axios";
import { type Setup } from "../types/playbook.types";
import { mockSetups } from "./playbook-mock";

export async function getSetups(useMock = false): Promise<Setup[]> {
  if (useMock) {
    return Promise.resolve(mockSetups);
  }
  const response = await axiosInstance.get<Setup[]>("/api/playbook/setups");
  return response.data;
}
