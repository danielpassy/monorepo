import "./client";
import { meAuthMeGet, logoutAuthLogoutPost, devLoginAuthDevLoginPost } from "./generated/sdk.gen";
import type { MeAuthMeGetResponse } from "./generated/types.gen";
import { apiUrl } from "@/settings";

export type User = MeAuthMeGetResponse;

export async function getMe(): Promise<User> {
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
  const { data, error } = await devLoginAuthDevLoginPost({
    body: { email },
    throwOnError: false,
  });
  if (error) throw error;
  return data!;
}
