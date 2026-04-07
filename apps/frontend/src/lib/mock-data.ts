import type { Client, Session } from "./types/therapy";

export const mockClients: Client[] = [
  {
    id: "client-1",
    name: "Elena Vance",
    email: "elena.vance@email.com",
    phone: "(555) 123-4567",
    startDate: "2023-06-15",
  },
  {
    id: "client-2",
    name: "Marcus Thorne",
    email: "marcus.t@email.com",
    phone: "(555) 987-6543",
    startDate: "2023-09-01",
  },
];

export const mockSessions: Session[] = [
  // Elena Vance sessions
  {
    id: "session-12",
    clientId: "client-1",
    date: "2023-10-24",
    sessionNumber: 12,
    status: "in-progress",
    duration: 50,
    documents: {
      transcript: [
        {
          id: "t1",
          timestamp: "10:02 AM",
          speaker: "therapist",
          speakerName: "Dr. Smith",
          content:
            "Elena, I noticed you hesitated when talking about the transition back to office work. Would you like to explore that feeling further?",
        },
        {
          id: "t2",
          timestamp: "10:03 AM",
          speaker: "client",
          speakerName: "Elena Vance",
          content:
            "It's just... the noise. I forgot how loud everything is. It feels like I can't filter out the distractions anymore. My focus just shatters after an hour.",
        },
        {
          id: "t3",
          timestamp: "10:05 AM",
          speaker: "therapist",
          speakerName: "Dr. Smith",
          content:
            '"Focus shatters"—that\'s a powerful way to describe it. Does this feel similar to the sensory overwhelm we discussed last month regarding the train commute?',
        },
        {
          id: "t4",
          timestamp: "10:07 AM",
          speaker: "client",
          speakerName: "Elena Vance",
          content:
            "Exactly. It's the same tightness in my chest. I find myself holding my breath without realizing it until it starts to hurt.",
        },
        {
          id: "t5",
          timestamp: "10:10 AM",
          speaker: "therapist",
          speakerName: "Dr. Smith",
          content:
            "That physical response is important to notice. Let's explore some grounding techniques that might help when you feel that tightness beginning.",
        },
        {
          id: "t6",
          timestamp: "10:12 AM",
          speaker: "client",
          speakerName: "Elena Vance",
          content:
            "I've tried deep breathing but it feels performative when I'm at my desk. Like everyone can see me struggling.",
        },
        {
          id: "t7",
          timestamp: "10:15 AM",
          speaker: "therapist",
          speakerName: "Dr. Smith",
          content:
            "The concern about being observed adds another layer. What if we explored some less visible techniques? Things you could do that wouldn't draw attention.",
        },
      ],
      notes: `Patient presents with significant sensory processing challenges related to the return-to-office mandate. Elena describes a "shattering" of focus after short durations of exposure to ambient office noise. Somatic symptoms include chest tightness and shallow breathing (apnea-like patterns during stress).

The connection between current work-related stress and previous trauma regarding public transit is becoming more explicit in her self-report.

Observed frequent shifting in seat and avoids eye contact when discussing managerial feedback. Anxiety levels appear elevated compared to baseline.

Plan for next phase:
• Focus on CBT sensory grounding techniques
• Explore boundary setting strategies for the office environment
• Monitor somatic responses during the upcoming week`,
      summary: "",
    },
  },
  {
    id: "session-11",
    clientId: "client-1",
    date: "2023-10-17",
    sessionNumber: 11,
    status: "completed",
    duration: 50,
    documents: {
      transcript: [
        {
          id: "t1",
          timestamp: "10:00 AM",
          speaker: "therapist",
          speakerName: "Dr. Smith",
          content: "How has your week been since we last met?",
        },
        {
          id: "t2",
          timestamp: "10:01 AM",
          speaker: "client",
          speakerName: "Elena Vance",
          content:
            "Better, actually. I tried the journaling exercise and it helped me identify some patterns I hadn't noticed before.",
        },
      ],
      notes:
        "Follow-up session focusing on journaling insights. Patient showing good engagement with homework assignments.",
      summary:
        "Session focused on reviewing journaling progress. Elena demonstrated insight into her anxiety patterns and showed improved self-awareness.",
    },
  },
  {
    id: "session-10",
    clientId: "client-1",
    date: "2023-10-10",
    sessionNumber: 10,
    status: "completed",
    duration: 50,
    documents: {
      transcript: [
        {
          id: "t1",
          timestamp: "10:00 AM",
          speaker: "therapist",
          speakerName: "Dr. Smith",
          content:
            "Today I'd like to introduce a new technique that might help with the workplace anxiety we've been discussing.",
        },
      ],
      notes: "Introduced cognitive restructuring techniques for workplace anxiety.",
      summary: "Introduced cognitive restructuring. Patient receptive to new techniques.",
    },
  },
  {
    id: "session-9",
    clientId: "client-1",
    date: "2023-10-03",
    sessionNumber: 9,
    status: "completed",
    duration: 50,
    documents: {
      transcript: [],
      notes: "Continued exploration of work-life balance challenges.",
      summary: "Discussed work-life balance and setting boundaries with supervisors.",
    },
  },
  // Marcus Thorne sessions
  {
    id: "session-4",
    clientId: "client-2",
    date: "2023-10-12",
    sessionNumber: 4,
    status: "in-progress",
    duration: 45,
    documents: {
      transcript: [
        {
          id: "t1",
          timestamp: "2:00 PM",
          speaker: "therapist",
          speakerName: "Dr. Smith",
          content:
            "Marcus, you mentioned feeling more agitated this week. Can you tell me more about what's been happening?",
        },
        {
          id: "t2",
          timestamp: "2:02 PM",
          speaker: "client",
          speakerName: "Marcus Thorne",
          content:
            "Work has been intense. My manager keeps scheduling last-minute meetings and it throws off my entire day.",
        },
        {
          id: "t3",
          timestamp: "2:05 PM",
          speaker: "therapist",
          speakerName: "Dr. Smith",
          content:
            "It sounds like unpredictability is a significant stressor for you. How do you typically respond when these meetings come up?",
        },
      ],
      notes: `Patient arrived appearing slightly more agitated than previous sessions. Hand tremors were noted during the first 5 minutes of discussion regarding workplace stressors.

We discussed the implementation of the 5-4-3-2-1 grounding technique. Marcus responded well to the tactile focus, noting a decrease in heart rate after the second cycle.

There appears to be a consistent trigger related to authoritative communication styles. Future sessions should pivot toward assertive communication training and role-playing boundary setting.`,
      summary: "",
    },
  },
  {
    id: "session-3",
    clientId: "client-2",
    date: "2023-10-05",
    sessionNumber: 3,
    status: "completed",
    duration: 45,
    documents: {
      transcript: [],
      notes: "Explored childhood dynamics and their influence on current workplace relationships.",
      summary: "Session focused on family of origin work and workplace dynamics.",
    },
  },
  {
    id: "session-2",
    clientId: "client-2",
    date: "2023-09-28",
    sessionNumber: 2,
    status: "completed",
    duration: 45,
    documents: {
      transcript: [],
      notes: "Continued assessment. Discussed anxiety symptoms in detail.",
      summary: "Continued intake assessment with focus on anxiety symptoms.",
    },
  },
  {
    id: "session-1",
    clientId: "client-2",
    date: "2023-09-21",
    sessionNumber: 1,
    status: "completed",
    duration: 60,
    documents: {
      transcript: [],
      notes:
        "Initial consultation. Patient presents with generalized anxiety and work-related stress.",
      summary: "Initial consultation completed. Established treatment goals.",
    },
  },
];

export function getClientById(clientId: string): Client | undefined {
  return mockClients.find((c) => c.id === clientId);
}

export function getSessionsByClientId(clientId: string): Session[] {
  return mockSessions
    .filter((s) => s.clientId === clientId)
    .sort((a, b) => b.sessionNumber - a.sessionNumber);
}

export function getSessionById(sessionId: string): Session | undefined {
  return mockSessions.find((s) => s.id === sessionId);
}
