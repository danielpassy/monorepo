const env = import.meta.env;

export const settings = {
  apiBaseUrl: env.VITE_API_BASE_URL ?? "http://localhost:8000",
  mswEnabled: env.VITE_MSW_ENABLED === "true",
} as const;

export function apiUrl(path: string): string {
  return new URL(path, settings.apiBaseUrl).toString();
}
