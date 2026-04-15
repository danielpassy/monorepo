import { http, HttpResponse } from "msw";
import { apiUrl } from "@/settings";

const mockUser = {
  user_id: 1,
  email: "dev@example.com",
  name: "Dev User",
};

export const authHandlers = [
  http.get(apiUrl("/auth/me"), () => {
    return HttpResponse.json(mockUser);
  }),

  http.post(apiUrl("/auth/logout"), () => {
    return HttpResponse.json({ detail: "logged out" });
  }),

  http.post(apiUrl("/auth/dev-login"), async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    const email = body?.email ?? "dev@example.com";
    return HttpResponse.json({ user_id: 1, email, name: email });
  }),
];
