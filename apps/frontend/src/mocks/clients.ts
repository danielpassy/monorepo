import { http, HttpResponse } from "msw";
import type { ClientOut } from "@/api/generated/types.gen";
import { apiUrl } from "@/core/settings";

const mockClients: ClientOut[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Elena Vance",
    email: "elena.vance@email.com",
    phone: "(555) 123-4567",
    start_date: "2023-06-15",
    created_at: "2023-06-15T10:00:00Z",
    updated_at: "2023-06-15T10:00:00Z",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Marcus Thorne",
    email: "marcus.t@email.com",
    phone: "(555) 987-6543",
    start_date: "2023-09-01",
    created_at: "2023-09-01T10:00:00Z",
    updated_at: "2023-09-01T10:00:00Z",
  },
];

export const clientHandlers = [
  http.get(apiUrl("/clients"), () => {
    return HttpResponse.json(mockClients);
  }),

  http.post(apiUrl("/clients"), async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      email?: string | null;
      phone?: string | null;
      start_date: string;
    };
    const newClient: ClientOut = {
      id: crypto.randomUUID(),
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      start_date: body.start_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockClients.push(newClient);
    return HttpResponse.json(newClient, { status: 201 });
  }),

  http.get(apiUrl("/clients/:client_id"), ({ params }) => {
    const client = mockClients.find((c) => c.id === params.client_id);
    if (!client) return HttpResponse.json({ detail: "client not found" }, { status: 404 });
    return HttpResponse.json(client);
  }),

  http.patch(apiUrl("/clients/:client_id"), async ({ params, request }) => {
    const idx = mockClients.findIndex((c) => c.id === params.client_id);
    if (idx === -1) return HttpResponse.json({ detail: "client not found" }, { status: 404 });
    const body = (await request.json()) as Partial<ClientOut>;
    mockClients[idx] = { ...mockClients[idx], ...body, updated_at: new Date().toISOString() };
    return HttpResponse.json(mockClients[idx]);
  }),

  http.delete(apiUrl("/clients/:client_id"), ({ params }) => {
    const idx = mockClients.findIndex((c) => c.id === params.client_id);
    if (idx === -1) return HttpResponse.json({ detail: "client not found" }, { status: 404 });
    mockClients.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
