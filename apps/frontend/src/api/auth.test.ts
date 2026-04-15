import { beforeAll, afterAll, afterEach, describe, test, expect } from "vite-plus/test";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { devLogin, getGoogleLoginUrl, getMe, logout } from "./auth";
import { settings } from "@/settings";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getMe", () => {
  test("returns user data on 200", async () => {
    server.use(
      http.get(`${settings.apiBaseUrl}/auth/me`, () =>
        HttpResponse.json({ user_id: 1, email: "a@b.com", name: "A B" }),
      ),
    );

    const user = await getMe();
    expect(user).toEqual({ user_id: 1, email: "a@b.com", name: "A B" });
  });

  test("throws on non-200", async () => {
    server.use(
      http.get(`${settings.apiBaseUrl}/auth/me`, () =>
        HttpResponse.json({ detail: "not authenticated" }, { status: 401 }),
      ),
    );

    await expect(getMe()).rejects.toBeTruthy();
  });
});

describe("logout", () => {
  test("resolves on 200", async () => {
    server.use(
      http.post(`${settings.apiBaseUrl}/auth/logout`, () =>
        HttpResponse.json({ detail: "logged out" }),
      ),
    );

    await expect(logout()).resolves.toBeUndefined();
  });
});

describe("devLogin", () => {
  test("sends the email and returns the user", async () => {
    server.use(
      http.post(`${settings.apiBaseUrl}/auth/dev-login`, async ({ request }) => {
        const body = (await request.json()) as { email: string };
        expect(body).toEqual({ email: "dev@example.com" });
        return HttpResponse.json({ user_id: 1, email: body.email, name: "Dev User" });
      }),
    );

    await expect(devLogin("dev@example.com")).resolves.toEqual({
      user_id: 1,
      email: "dev@example.com",
      name: "Dev User",
    });
  });
});

describe("getGoogleLoginUrl", () => {
  test("builds the backend google login url", () => {
    expect(getGoogleLoginUrl()).toBe(`${settings.apiBaseUrl}/auth/google`);
  });
});
