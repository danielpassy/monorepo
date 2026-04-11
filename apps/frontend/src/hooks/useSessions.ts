import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listSessions,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  generateSummary,
  listTranscriptEntries,
} from "@/api/sessions";
import type { CreateSessionBody, UpdateSessionBody } from "@/api/generated/types.gen";

export const sessionsQueryKey = (clientId: string) => ["sessions", "byClient", clientId] as const;

export const sessionQueryKey = (sessionId: string) => ["sessions", sessionId] as const;

export const transcriptEntriesQueryKey = (sessionId: string) =>
  ["transcriptEntries", sessionId] as const;

export function useSessions(clientId: string) {
  return useQuery({
    queryKey: sessionsQueryKey(clientId),
    queryFn: () => listSessions(clientId),
    enabled: !!clientId,
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: sessionQueryKey(sessionId),
    queryFn: () => getSession(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateSession(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSessionBody) => createSession(clientId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionsQueryKey(clientId) });
    },
  });
}

export function useUpdateSession(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSessionBody) => updateSession(sessionId, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(sessionQueryKey(sessionId), updated);
    },
  });
}

export function useDeleteSession(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => deleteSession(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionsQueryKey(clientId) });
    },
  });
}

export function useGenerateSummary(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateSummary(sessionId),
    onSuccess: (updated) => {
      queryClient.setQueryData(sessionQueryKey(sessionId), updated);
    },
  });
}

export function useTranscriptEntries(sessionId: string) {
  return useQuery({
    queryKey: transcriptEntriesQueryKey(sessionId),
    queryFn: () => listTranscriptEntries(sessionId),
    enabled: !!sessionId,
  });
}
