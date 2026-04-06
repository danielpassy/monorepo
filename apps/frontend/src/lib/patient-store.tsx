
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Client, Session } from "./types/therapy";
import { mockClients, mockSessions } from "./mock-data";

interface PatientStore {
  clients: Client[];
  sessions: Session[];
  addClient: (name: string) => Client;
  deleteClient: (clientId: string) => void;
  addSession: (clientId: string) => Session;
  deleteSession: (sessionId: string) => void;
  getClientById: (clientId: string) => Client | undefined;
  getSessionsByClientId: (clientId: string) => Session[];
  getSessionById: (sessionId: string) => Session | undefined;
}

const PatientStoreContext = createContext<PatientStore | null>(null);

export function PatientStoreProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([...mockClients]);
  const [sessions, setSessions] = useState<Session[]>([...mockSessions]);

  const addClient = useCallback((name: string): Client => {
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@email.com`,
      phone: "(555) 000-0000",
      startDate: new Date().toISOString().split("T")[0],
    };
    setClients((prev) => [...prev, newClient]);
    return newClient;
  }, []);

  const deleteClient = useCallback((clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    setSessions((prev) => prev.filter((s) => s.clientId !== clientId));
  }, []);

  const addSession = useCallback(
    (clientId: string): Session => {
      const clientSessions = sessions.filter((s) => s.clientId === clientId);
      const maxSessionNumber = clientSessions.reduce((max, s) => Math.max(max, s.sessionNumber), 0);

      const newSession: Session = {
        id: `session-${Date.now()}`,
        clientId,
        date: new Date().toISOString().split("T")[0],
        sessionNumber: maxSessionNumber + 1,
        status: "in-progress",
        documents: {
          transcript: [],
          notes: "",
          summary: "",
        },
      };
      setSessions((prev) => [newSession, ...prev]);
      return newSession;
    },
    [sessions],
  );

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  }, []);

  const getClientById = useCallback(
    (clientId: string) => clients.find((c) => c.id === clientId),
    [clients],
  );

  const getSessionsByClientId = useCallback(
    (clientId: string) =>
      sessions
        .filter((s) => s.clientId === clientId)
        .sort((a, b) => b.sessionNumber - a.sessionNumber),
    [sessions],
  );

  const getSessionById = useCallback(
    (sessionId: string) => sessions.find((s) => s.id === sessionId),
    [sessions],
  );

  return (
    <PatientStoreContext.Provider
      value={{
        clients,
        sessions,
        addClient,
        deleteClient,
        addSession,
        deleteSession,
        getClientById,
        getSessionsByClientId,
        getSessionById,
      }}
    >
      {children}
    </PatientStoreContext.Provider>
  );
}

export function usePatientStore(): PatientStore {
  const context = useContext(PatientStoreContext);
  if (!context) {
    throw new Error("usePatientStore must be used within a PatientStoreProvider");
  }
  return context;
}
