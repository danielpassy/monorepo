// @vitest-environment jsdom
import { createElement } from "react";
import React from "react";
import { expect, test, beforeAll, afterAll, afterEach, vi } from "vite-plus/test";

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

import HomePage from "@/pages/home";
import { renderPage } from "@/test/render-page";
import { withQueryClient } from "@/test/page-wrappers";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:8000";

const server = setupServer(
  http.get(`${API_BASE}/auth/me`, () =>
    HttpResponse.json({ user_id: 1, email: "dev@example.com", name: "Dev User" }),
  ),
  http.get(`${API_BASE}/customers`, () =>
    HttpResponse.json([
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Elena Vance",
        email: "elena@example.com",
        phone: null,
        start_date: "2023-06-15",
        created_at: "2023-06-15T10:00:00Z",
        updated_at: "2023-06-15T10:00:00Z",
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Marcus Thorne",
        email: "marcus@example.com",
        phone: null,
        start_date: "2023-09-01",
        created_at: "2023-09-01T10:00:00Z",
        updated_at: "2023-09-01T10:00:00Z",
      },
    ]),
  ),
  http.get(`${API_BASE}/customers/11111111-1111-1111-1111-111111111111/sessions`, () =>
    HttpResponse.json([
      {
        id: "aaaa0001-0000-0000-0000-000000000000",
        customer_id: "11111111-1111-1111-1111-111111111111",
        therapist_id: 1,
        date: "2023-10-24",
        session_number: 12,
        duration_minutes: 50,
        notes: "Latest session.",
        summary: null,
        created_at: "2023-10-24T10:00:00Z",
        updated_at: "2023-10-24T10:00:00Z",
      },
      {
        id: "aaaa0002-0000-0000-0000-000000000000",
        customer_id: "11111111-1111-1111-1111-111111111111",
        therapist_id: 1,
        date: "2023-10-17",
        session_number: 11,
        duration_minutes: 50,
        notes: "Previous session.",
        summary: null,
        created_at: "2023-10-17T10:00:00Z",
        updated_at: "2023-10-17T10:00:00Z",
      },
    ]),
  ),
  http.get(`${API_BASE}/customers/22222222-2222-2222-2222-222222222222/sessions`, () =>
    HttpResponse.json([]),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  server.resetHandlers();
  mockNavigate.mockReset();
});
afterAll(() => server.close());

test("home page renders the patient list from the API", async () => {
  const { waitFor } = await import("@testing-library/react");
  const container = await renderPage(<HomePage />, { wrappers: [withQueryClient] });

  await waitFor(() => {
    expect(container.textContent).toContain("Elena Vance");
  });

  expect(container.textContent).toContain("Marcus Thorne");
  expect(container.textContent).toContain("Pacientes");
});

test("clicking a patient card opens the latest session", async () => {
  const { waitFor, fireEvent } = await import("@testing-library/react");
  const container = await renderPage(<HomePage />, { wrappers: [withQueryClient] });

  await waitFor(() => {
    expect(container.textContent).toContain("Elena Vance");
  });

  await waitFor(() => {
    const cards = Array.from(container.querySelectorAll("[data-slot='card'][tabindex='0']"));
    expect(cards.some((card) => card.textContent?.includes("Elena Vance"))).toBe(true);
  });
  const elenaCard = Array.from(container.querySelectorAll("[data-slot='card'][tabindex='0']")).find(
    (card) => card.textContent?.includes("Elena Vance"),
  );
  expect(elenaCard).toBeTruthy();

  fireEvent.click(elenaCard!);

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/customers/$customerId/sessions/$sessionId",
      params: {
        customerId: "11111111-1111-1111-1111-111111111111",
        sessionId: "aaaa0001-0000-0000-0000-000000000000",
      },
    });
  });
});

test("home page shows empty state when there are no clients", async () => {
  server.use(http.get(`${API_BASE}/customers`, () => HttpResponse.json([])));

  const { waitFor } = await import("@testing-library/react");
  const container = await renderPage(<HomePage />, { wrappers: [withQueryClient] });

  await waitFor(() => {
    expect(container.textContent).toContain("Nenhum paciente ainda");
  });
});
