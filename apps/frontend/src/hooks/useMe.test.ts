import { beforeAll, afterAll, afterEach, describe, test, expect } from "vite-plus/test";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useMe } from "./useMe";

const API_BASE = "http://localhost:8000";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe("useMe", () => {
  test("returns user when session is active", async () => {
    server.use(
      http.get(`${API_BASE}/auth/me`, () =>
        HttpResponse.json({ user_id: 1, email: "a@b.com", name: "A B" }),
      ),
    );

    const { result } = renderHook(() => useMe(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ user_id: 1, email: "a@b.com", name: "A B" });
  });

  test("returns error when not authenticated", async () => {
    server.use(
      http.get(`${API_BASE}/auth/me`, () =>
        HttpResponse.json({ detail: "not authenticated" }, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => useMe(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
