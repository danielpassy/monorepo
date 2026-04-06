export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  startDate: string;
}

export interface TranscriptEntry {
  id: string;
  timestamp: string;
  speaker: "therapist" | "client";
  speakerName: string;
  content: string;
}

export interface SessionDocuments {
  transcript: TranscriptEntry[];
  notes: string;
  summary: string;
}

export interface Session {
  id: string;
  clientId: string;
  date: string;
  sessionNumber: number;
  status: "completed" | "in-progress" | "scheduled";
  duration?: number; // in minutes
  documents: SessionDocuments;
}

export type DocumentType = "transcript" | "notes" | "summary";
