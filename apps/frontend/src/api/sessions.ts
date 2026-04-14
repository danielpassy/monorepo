import "./client";
import {
  listSessionsCustomersCustomerIdSessionsGet,
  createSessionCustomersCustomerIdSessionsPost,
  getSessionSessionsSessionIdGet,
  updateSessionSessionsSessionIdPatch,
  deleteSessionSessionsSessionIdDelete,
  generateSummarySessionsSessionIdSummaryGeneratePost,
  listTranscriptEntriesSessionsSessionIdTranscriptEntriesGet,
  createTranscriptEntrySessionsSessionIdTranscriptEntriesPost,
  getTranscriptEntrySessionTranscriptEntriesEntryIdGet,
  updateTranscriptEntrySessionTranscriptEntriesEntryIdPatch,
} from "./generated/sdk.gen";
import type {
  SessionOut,
  TranscriptEntryOut,
  CreateSessionInput,
  UpdateSessionInput,
  CreateTranscriptEntryInput,
  UpdateTranscriptEntryInput,
} from "./generated/types.gen";

export type { SessionOut, TranscriptEntryOut };

export async function listSessions(clientId: string): Promise<SessionOut[]> {
  const { data, error } = await listSessionsCustomersCustomerIdSessionsGet({
    path: { customer_id: clientId },
    throwOnError: false,
  });
  if (error) throw error;
  return data!;
}

export async function createSession(
  clientId: string,
  body: CreateSessionInput,
): Promise<SessionOut> {
  const { data, error } = await createSessionCustomersCustomerIdSessionsPost({
    path: { customer_id: clientId },
    body,
    throwOnError: false,
  });
  if (error) throw error;
  return data!;
}

export async function getSession(sessionId: string): Promise<SessionOut> {
  const { data, error } = await getSessionSessionsSessionIdGet({
    path: { session_id: sessionId },
    throwOnError: false,
  });
  if (error) throw error;
  return data!;
}

export async function updateSession(
  sessionId: string,
  body: UpdateSessionInput,
): Promise<SessionOut> {
  const { data, error } = await updateSessionSessionsSessionIdPatch({
    path: { session_id: sessionId },
    body,
    throwOnError: false,
  });
  if (error) throw error;
  return data!;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await deleteSessionSessionsSessionIdDelete({
    path: { session_id: sessionId },
    throwOnError: false,
  });
  if (error) throw error;
}

export async function generateSummary(sessionId: string): Promise<SessionOut> {
  const { data, error } = await generateSummarySessionsSessionIdSummaryGeneratePost({
    path: { session_id: sessionId },
    throwOnError: false,
  });
  if (error) throw error;
  return data!;
}

export async function listTranscriptEntries(sessionId: string): Promise<TranscriptEntryOut[]> {
  const { data, error } = await listTranscriptEntriesSessionsSessionIdTranscriptEntriesGet({
    path: { session_id: sessionId },
    throwOnError: false,
  });
  if (error) throw error;
  return data!;
}

export async function createTranscriptEntry(
  sessionId: string,
  body: CreateTranscriptEntryInput,
): Promise<TranscriptEntryOut> {
  const { data, error } = await createTranscriptEntrySessionsSessionIdTranscriptEntriesPost({
    path: { session_id: sessionId },
    body,
    throwOnError: false,
  });
  if (error) throw error;
  return data!;
}

export async function getTranscriptEntry(entryId: string): Promise<TranscriptEntryOut> {
  const { data, error } = await getTranscriptEntrySessionTranscriptEntriesEntryIdGet({
    path: { entry_id: entryId },
    throwOnError: false,
  });
  if (error) throw error;
  return data!;
}

export async function updateTranscriptEntry(
  entryId: string,
  body: UpdateTranscriptEntryInput,
): Promise<TranscriptEntryOut> {
  const { data, error } = await updateTranscriptEntrySessionTranscriptEntriesEntryIdPatch({
    path: { entry_id: entryId },
    body,
    throwOnError: false,
  });
  if (error) throw error;
  return data!;
}
