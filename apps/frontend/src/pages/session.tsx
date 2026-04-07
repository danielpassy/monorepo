import { useParams, useNavigate } from "@tanstack/react-router";
import { usePatientStore } from "@/lib/patient-store";
import { AppHeader } from "@/components/therapy/app-header";
import { ClientHeader } from "@/components/therapy/client-header";
import { SessionSidebar } from "@/components/therapy/session-sidebar";
import { SessionWorkspace } from "@/components/therapy/session-workspace";

export default function SessionPage() {
  const { clientId, sessionId } = useParams({ strict: false }) as {
    clientId: string;
    sessionId: string;
  };
  const navigate = useNavigate();

  const { getClientById, getSessionById, getSessionsByClientId, addSession, deleteSession } =
    usePatientStore();

  const client = getClientById(clientId);
  const session = getSessionById(sessionId);
  const clientSessions = getSessionsByClientId(clientId);

  if (!client) {
    void navigate({ to: "/" });
    return null;
  }

  if (!session || session.clientId !== clientId) {
    if (clientSessions.length > 0) {
      void navigate({
        to: "/clients/$clientId/sessions/$sessionId",
        params: { clientId, sessionId: clientSessions[0].id },
      });
    } else {
      void navigate({ to: "/" });
    }
    return null;
  }

  const handleNewSession = () => {
    return addSession(clientId);
  };

  const handleDeleteSession = (sessionIdToDelete: string) => {
    deleteSession(sessionIdToDelete);
  };

  return (
    <div className="flex h-screen flex-col bg-muted/20">
      <AppHeader />
      <ClientHeader client={client} session={session} />

      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar
          sessions={clientSessions}
          currentSessionId={sessionId}
          clientId={clientId}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
        />
        <main className="flex-1 overflow-hidden">
          <SessionWorkspace session={session} clientName={client.name} />
        </main>
      </div>
    </div>
  );
}
