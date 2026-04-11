import { client } from "./client";
import { meAuthMeGet, logoutAuthLogoutPost } from "./generated/sdk.gen";
import type { MeAuthMeGetResponse } from "./generated/types.gen";
import { apiUrl } from "@/settings";

export type { MeAuthMeGetResponse as User };

export async function getMe(): Promise<MeAuthMeGetResponse> {
  const { data, error } = await meAuthMeGet({ throwOnError: false });
  if (error) throw error;
  return data!;
}

export async function logout(): Promise<void> {
  await logoutAuthLogoutPost({ throwOnError: false });
}

export function getGoogleLoginUrl(): string {
  return apiUrl("/auth/google");
}

export async function devLogin(email: string): Promise<User> {
  const { data, error } = await client.request<User>({
    method: "POST",
    url: "/auth/dev-login",
    body: { email },
    headers: {
      "Content-Type": "application/json",
    },
    throwOnError: false,
  });

  if (error) {
    throw error;
  }

  return data!;
}
