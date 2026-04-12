import { http, HttpResponse } from "msw";
import type { CustomerOut } from "@/api/generated/types.gen";
import { apiUrl } from "@/settings";

const mockCustomers: CustomerOut[] = [
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

export const customerHandlers = [
  http.get(apiUrl("/customers"), () => {
    return HttpResponse.json(mockCustomers);
  }),

  http.post(apiUrl("/customers"), async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      email?: string | null;
      phone?: string | null;
      start_date: string;
    };
    const newCustomer: CustomerOut = {
      id: crypto.randomUUID(),
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      start_date: body.start_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockCustomers.push(newCustomer);
    return HttpResponse.json(newCustomer, { status: 201 });
  }),

  http.get(apiUrl("/customers/:customer_id"), ({ params }) => {
    const customer = mockCustomers.find((c) => c.id === params.customer_id);
    if (!customer) return HttpResponse.json({ detail: "customer not found" }, { status: 404 });
    return HttpResponse.json(customer);
  }),

  http.patch(apiUrl("/customers/:customer_id"), async ({ params, request }) => {
    const idx = mockCustomers.findIndex((c) => c.id === params.customer_id);
    if (idx === -1) return HttpResponse.json({ detail: "customer not found" }, { status: 404 });
    const body = (await request.json()) as Partial<CustomerOut>;
    mockCustomers[idx] = { ...mockCustomers[idx], ...body, updated_at: new Date().toISOString() };
    return HttpResponse.json(mockCustomers[idx]);
  }),

  http.delete(apiUrl("/customers/:customer_id"), ({ params }) => {
    const idx = mockCustomers.findIndex((c) => c.id === params.customer_id);
    if (idx === -1) return HttpResponse.json({ detail: "customer not found" }, { status: 404 });
    mockCustomers.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
