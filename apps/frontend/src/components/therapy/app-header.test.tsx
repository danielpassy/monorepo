// @vitest-environment jsdom
import { expect, test, beforeAll, afterAll, afterEach, vi } from "vite-plus/test";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { renderPage } from "@/test/render-page";
import { withQueryClient } from "@/test/page-wrappers";
import { AppHeader } from "./app-header";
import "@/test/page-test-setup";

const API_BASE = "http://localhost:8000";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children }: { children: React.ReactNode }) => createElement("span", null, children),
    useNavigate: () => mockNavigate,
  };
});

import { createElement } from "react";
import React from "react";

const server = setupServer(
  http.get(`${API_BASE}/auth/me`, () =>
    HttpResponse.json({ user_id: 1, email: "dev@example.com", name: "Dev User" }),
  ),
  http.post(`${API_BASE}/auth/logout`, () => HttpResponse.json({ detail: "logged out" })),
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  server.resetHandlers();
  mockNavigate.mockReset();
});
afterAll(() => server.close());

test("renders user initials from /auth/me", async () => {
  const { waitFor } = await import("@testing-library/react");
  const container = await renderPage(<AppHeader />, { wrappers: [withQueryClient] });

  await waitFor(() => {
    expect(container.textContent).toContain("DU");
  });
});

test("clicking logout calls POST /auth/logout and redirects to /login", async () => {
  const { waitFor, fireEvent } = await import("@testing-library/react");
  const container = await renderPage(<AppHeader />, { wrappers: [withQueryClient] });

  // Wait for initials to appear (user loaded)
  await waitFor(() => {
    expect(container.textContent).toContain("DU");
  });

  // Open dropdown by clicking the avatar button (Radix trigger needs pointer events)
  const trigger = container.querySelector("[data-slot='dropdown-menu-trigger']") as HTMLElement;
  fireEvent.pointerDown(trigger);
  fireEvent.click(trigger);

  // Radix portals into document.body — find menu item there
  let logoutItem: Element | undefined;
  await waitFor(() => {
    logoutItem = Array.from(document.querySelectorAll("[role='menuitem']")).find((el) =>
      el.textContent?.includes("Sair"),
    );
    expect(logoutItem).toBeTruthy();
  });

  fireEvent.click(logoutItem!);

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
  });
});
