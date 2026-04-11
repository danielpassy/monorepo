import { useParams, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/therapy/app-header";
import { ClientHeader } from "@/components/therapy/client-header";
import { SessionSidebar } from "@/components/therapy/session-sidebar";
import { SessionWorkspace } from "@/components/therapy/session-workspace";
import { useClient } from "@/hooks/useClients";
import {
  useSessions,
  useSession,
  useCreateSession,
  useDeleteSession,
  useUpdateSession,
  useGenerateSummary,
  useTranscriptEntries,
} from "@/hooks/useSessions";

export default function SessionPage() {
  const { clientId, sessionId } = useParams({ strict: false }) as {
    clientId: string;
    sessionId: string;
  };
  const navigate = useNavigate();

  const { data: client, isLoading: clientLoading } = useClient(clientId);
  const { data: session, isLoading: sessionLoading } = useSession(sessionId);
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions(clientId);
  const { data: transcriptEntries = [] } = useTranscriptEntries(sessionId);

  const createSession = useCreateSession(clientId);
  const deleteSession = useDeleteSession(clientId);
  const updateSession = useUpdateSession(sessionId);
  const generateSummary = useGenerateSummary(sessionId);

  const isLoading = clientLoading || sessionLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!client) {
    void navigate({ to: "/" });
    return null;
  }

  if (!session || session.client_id !== clientId) {
    if (sessions.length > 0) {
      void navigate({
        to: "/clients/$clientId/sessions/$sessionId",
        params: { clientId, sessionId: sessions[0].id },
      });
    } else {
      void navigate({ to: "/" });
    }
    return null;
  }

  const handleNewSession = async () => {
    const today = new Date().toISOString().split("T")[0];
    return createSession.mutateAsync({ date: today });
  };

  const handleDeleteSession = async (sessionIdToDelete: string) => {
    await deleteSession.mutateAsync(sessionIdToDelete);
  };

  const handleNotesSave = (notes: string) => {
    updateSession.mutate({ notes });
  };

  const handleSummarySave = (summary: string) => {
    updateSession.mutate({ summary });
  };

  const handleGenerateSummary = async () => {
    await generateSummary.mutateAsync();
  };

  return (
    <div className="flex h-screen flex-col bg-muted/20">
      <AppHeader />
      <ClientHeader client={client} session={session} />

      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar
          sessions={sessions}
          currentSessionId={sessionId}
          clientId={clientId}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
        />
        <main className="flex-1 overflow-hidden">
          <SessionWorkspace
            session={session}
            transcriptEntries={transcriptEntries}
            onNotesSave={handleNotesSave}
            onSummarySave={handleSummarySave}
            onGenerateSummary={handleGenerateSummary}
            isGeneratingSummary={generateSummary.isPending}
          />
        </main>
      </div>
    </div>
  );
}
