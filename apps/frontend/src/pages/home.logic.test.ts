import { expect, test } from "vite-plus/test";
import { mockClients, mockSessions } from "@/lib/mock-data";
import { getClientDisplayData, getClientInitials, getLatestSession } from "./home.logic";

test("home logic derives client display data", () => {
  const client = mockClients[0];
  const sessions = mockSessions.filter((session) => session.clientId === client.id);

  const result = getClientDisplayData(client, sessions);

  expect(result.initials).toBe("EV");
  expect(result.latestSession?.id).toBe("session-12");
  expect(result.sessionLabel).toBe("4 sessões");
});

test("home logic handles a single-word client name", () => {
  expect(getClientInitials("Madonna")).toBe("M");
});

test("home logic returns the first session as the latest one", () => {
  const sessions = mockSessions.filter((session) => session.clientId === "client-2");

  expect(getLatestSession(sessions)?.id).toBe("session-4");
});
