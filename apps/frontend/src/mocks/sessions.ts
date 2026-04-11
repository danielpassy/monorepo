import { http, HttpResponse } from "msw";
import type { SessionOut, TranscriptEntryOut } from "@/api/generated/types.gen";
import { apiUrl } from "@/settings";

const mockSessions: SessionOut[] = [
  {
    id: "aaaa0001-0000-0000-0000-000000000000",
    client_id: "11111111-1111-1111-1111-111111111111",
    therapist_id: 1,
    date: "2023-10-24",
    session_number: 12,
    duration_minutes: 50,
    notes: `Patient presents with significant sensory processing challenges related to the return-to-office mandate.`,
    summary: null,
    created_at: "2023-10-24T10:00:00Z",
    updated_at: "2023-10-24T10:00:00Z",
  },
  {
    id: "aaaa0002-0000-0000-0000-000000000000",
    client_id: "11111111-1111-1111-1111-111111111111",
    therapist_id: 1,
    date: "2023-10-17",
    session_number: 11,
    duration_minutes: 50,
    notes: "Follow-up session focusing on journaling insights.",
    summary: "Session focused on reviewing journaling progress.",
    created_at: "2023-10-17T10:00:00Z",
    updated_at: "2023-10-17T10:00:00Z",
  },
  {
    id: "bbbb0001-0000-0000-0000-000000000000",
    client_id: "22222222-2222-2222-2222-222222222222",
    therapist_id: 1,
    date: "2023-10-12",
    session_number: 4,
    duration_minutes: 45,
    notes: "Patient arrived appearing slightly more agitated than previous sessions.",
    summary: null,
    created_at: "2023-10-12T10:00:00Z",
    updated_at: "2023-10-12T10:00:00Z",
  },
];

const mockTranscriptEntries: TranscriptEntryOut[] = [
  {
    id: "tttt0001-0000-0000-0000-000000000000",
    session_id: "aaaa0001-0000-0000-0000-000000000000",
    status: "processed",
    audio_files: [],
    transcript:
      "Dr. Smith: Elena, I noticed you hesitated when talking about the transition back to office work.\n\nElena: It's just... the noise. I forgot how loud everything is.",
    created_at: "2023-10-24T10:05:00Z",
    updated_at: "2023-10-24T10:05:00Z",
  },
];

export const sessionHandlers = [
  http.get(apiUrl("/clients/:client_id/sessions"), ({ params }) => {
    const sessions = mockSessions
      .filter((s) => s.client_id === params.client_id)
      .sort((a, b) => b.session_number - a.session_number);
    return HttpResponse.json(sessions);
  }),

  http.post(apiUrl("/clients/:client_id/sessions"), async ({ params, request }) => {
    const body = (await request.json()) as {
      date: string;
      duration_minutes?: number | null;
      notes?: string | null;
    };
    const clientSessions = mockSessions.filter((s) => s.client_id === params.client_id);
    const maxNum = clientSessions.reduce((max, s) => Math.max(max, s.session_number), 0);
    const newSession: SessionOut = {
      id: crypto.randomUUID(),
      client_id: params.client_id as string,
      therapist_id: 1,
      date: body.date,
      session_number: maxNum + 1,
      duration_minutes: body.duration_minutes ?? null,
      notes: body.notes ?? null,
      summary: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockSessions.push(newSession);
    return HttpResponse.json(newSession, { status: 201 });
  }),

  http.get(apiUrl("/sessions/:session_id"), ({ params }) => {
    const session = mockSessions.find((s) => s.id === params.session_id);
    if (!session) return HttpResponse.json({ detail: "session not found" }, { status: 404 });
    return HttpResponse.json(session);
  }),

  http.patch(apiUrl("/sessions/:session_id"), async ({ params, request }) => {
    const idx = mockSessions.findIndex((s) => s.id === params.session_id);
    if (idx === -1) return HttpResponse.json({ detail: "session not found" }, { status: 404 });
    const body = (await request.json()) as Partial<SessionOut>;
    mockSessions[idx] = { ...mockSessions[idx], ...body, updated_at: new Date().toISOString() };
    return HttpResponse.json(mockSessions[idx]);
  }),

  http.delete(apiUrl("/sessions/:session_id"), ({ params }) => {
    const idx = mockSessions.findIndex((s) => s.id === params.session_id);
    if (idx === -1) return HttpResponse.json({ detail: "session not found" }, { status: 404 });
    mockSessions.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(apiUrl("/sessions/:session_id/summary/generate"), ({ params }) => {
    const idx = mockSessions.findIndex((s) => s.id === params.session_id);
    if (idx === -1) return HttpResponse.json({ detail: "session not found" }, { status: 404 });
    const session = mockSessions[idx];
    const parts: string[] = [];
    if (session.notes) parts.push(`Notas clínicas:\n${session.notes}`);
    mockSessions[idx] = {
      ...session,
      summary: parts.length ? parts.join("\n\n") : "Nenhum conteúdo disponível.",
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(mockSessions[idx]);
  }),

  http.get(apiUrl("/sessions/:session_id/transcript-entries"), ({ params }) => {
    const entries = mockTranscriptEntries.filter((e) => e.session_id === params.session_id);
    return HttpResponse.json(entries);
  }),

  http.post(apiUrl("/sessions/:session_id/transcript-entries"), async ({ params, request }) => {
    const body = (await request.json()) as { audio_files?: string[] };
    const newEntry: TranscriptEntryOut = {
      id: crypto.randomUUID(),
      session_id: params.session_id as string,
      status: "waiting_to_be_processed",
      audio_files: body.audio_files ?? [],
      transcript: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockTranscriptEntries.push(newEntry);
    return HttpResponse.json(newEntry, { status: 201 });
  }),

  http.get(apiUrl("/session-transcript-entries/:entry_id"), ({ params }) => {
    const entry = mockTranscriptEntries.find((e) => e.id === params.entry_id);
    if (!entry) return HttpResponse.json({ detail: "transcript entry not found" }, { status: 404 });
    return HttpResponse.json(entry);
  }),

  http.patch(apiUrl("/session-transcript-entries/:entry_id"), async ({ params, request }) => {
    const idx = mockTranscriptEntries.findIndex((e) => e.id === params.entry_id);
    if (idx === -1)
      return HttpResponse.json({ detail: "transcript entry not found" }, { status: 404 });
    const body = (await request.json()) as Partial<TranscriptEntryOut>;
    mockTranscriptEntries[idx] = {
      ...mockTranscriptEntries[idx],
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(mockTranscriptEntries[idx]);
  }),
];
