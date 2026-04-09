import type { Client, Session } from "@/lib/types/therapy";

export function getClientInitials(clientName: string): string {
  return clientName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("");
}

export function getLatestSession(sessions: Session[]): Session | undefined {
  return sessions[0];
}

export function getClientSessionLabel(sessionCount: number): string {
  return `${sessionCount} ${sessionCount === 1 ? "sessão" : "sessões"}`;
}

export function getClientDisplayData(client: Client, sessions: Session[]) {
  return {
    initials: getClientInitials(client.name),
    latestSession: getLatestSession(sessions),
    sessionLabel: getClientSessionLabel(sessions.length),
  };
}
