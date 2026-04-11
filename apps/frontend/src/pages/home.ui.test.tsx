// @vitest-environment jsdom
import HomePage from "@/pages/home";
import { expect, test, beforeAll, afterAll, afterEach } from "vite-plus/test";
import { renderPage } from "@/test/render-page";
import { withQueryClient } from "@/test/page-wrappers";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:8000";

const server = setupServer(
  http.get(`${API_BASE}/auth/me`, () =>
    HttpResponse.json({ user_id: 1, email: "dev@example.com", name: "Dev User" }),
  ),
  http.get(`${API_BASE}/clients`, () =>
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
);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
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

test("home page shows empty state when there are no clients", async () => {
  server.use(http.get(`${API_BASE}/clients`, () => HttpResponse.json([])));

  const { waitFor } = await import("@testing-library/react");
  const container = await renderPage(<HomePage />, { wrappers: [withQueryClient] });

  await waitFor(() => {
    expect(container.textContent).toContain("Nenhum paciente ainda");
  });
});
