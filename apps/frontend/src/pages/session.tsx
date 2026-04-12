import { useParams, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/therapy/app-header";
import { CustomerHeader } from "@/components/therapy/customer-header";
import { SessionSidebar } from "@/components/therapy/session-sidebar";
import { SessionWorkspace } from "@/components/therapy/session-workspace";
import { useCustomer } from "@/hooks/useCustomers";
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
  const { customerId, sessionId } = useParams({ strict: false }) as {
    customerId: string;
    sessionId: string;
  };
  const navigate = useNavigate();

  const { data: customer, isLoading: customerLoading } = useCustomer(customerId);
  const { data: session, isLoading: sessionLoading } = useSession(sessionId);
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions(customerId);
  const { data: transcriptEntries = [] } = useTranscriptEntries(sessionId);

  const createSession = useCreateSession(customerId);
  const deleteSession = useDeleteSession(customerId);
  const updateSession = useUpdateSession(sessionId);
  const generateSummary = useGenerateSummary(sessionId);

  const isLoading = customerLoading || sessionLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!customer) {
    void navigate({ to: "/" });
    return null;
  }

  if (!session || session.customer_id !== customerId) {
    if (sessions.length > 0) {
      void navigate({
        to: "/customers/$customerId/sessions/$sessionId",
        params: { customerId, sessionId: sessions[0].id },
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
      <CustomerHeader customer={customer} session={session} />

      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar
          sessions={sessions}
          currentSessionId={sessionId}
          clientId={customerId}
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
