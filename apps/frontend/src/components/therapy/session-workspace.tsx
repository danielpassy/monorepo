import { useState, useEffect } from "react";
import type { DocumentType } from "@/lib/types/therapy";
import type { SessionOut, TranscriptEntryOut } from "@/api/generated/types.gen";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { DocumentPanel } from "./document-panel";

interface SessionWorkspaceProps {
  session: SessionOut;
  transcriptEntries: TranscriptEntryOut[];
  onNotesSave: (notes: string) => void;
  onSummarySave: (summary: string) => void;
  onGenerateSummary: () => Promise<void>;
  isGeneratingSummary: boolean;
}

const COLLAPSE_THRESHOLD = 15;

export function SessionWorkspace({
  session,
  transcriptEntries,
  onNotesSave,
  onSummarySave,
  onGenerateSummary,
  isGeneratingSummary,
}: SessionWorkspaceProps) {
  const [notes, setNotes] = useState(session.notes ?? "");
  const [summary, setSummary] = useState(session.summary ?? "");

  const [leftDocumentType, setLeftDocumentType] = useState<DocumentType>("transcript");
  const [rightDocumentType, setRightDocumentType] = useState<DocumentType>("notes");

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Sync when session data updates (e.g. after summary generation)
  useEffect(() => {
    setNotes(session.notes ?? "");
  }, [session.id, session.notes]);

  useEffect(() => {
    setSummary(session.summary ?? "");
  }, [session.id, session.summary]);

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      <ResizablePanel
        defaultSize={50}
        minSize={0}
        collapsible
        collapsedSize={0}
        onResize={({ asPercentage }) => setLeftCollapsed(asPercentage < COLLAPSE_THRESHOLD)}
      >
        {!leftCollapsed && (
          <DocumentPanel
            documentType={leftDocumentType}
            onDocumentTypeChange={setLeftDocumentType}
            transcriptEntries={transcriptEntries}
            notes={notes}
            summary={summary}
            onNotesChange={setNotes}
            onNotesSave={onNotesSave}
            onSummaryChange={setSummary}
            onSummarySave={onSummarySave}
            onGenerateSummary={onGenerateSummary}
            isGeneratingSummary={isGeneratingSummary}
          />
        )}
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel
        defaultSize={50}
        minSize={0}
        collapsible
        collapsedSize={0}
        onResize={({ asPercentage }) => setRightCollapsed(asPercentage < COLLAPSE_THRESHOLD)}
      >
        {!rightCollapsed && (
          <DocumentPanel
            documentType={rightDocumentType}
            onDocumentTypeChange={setRightDocumentType}
            transcriptEntries={transcriptEntries}
            notes={notes}
            summary={summary}
            onNotesChange={setNotes}
            onNotesSave={onNotesSave}
            onSummaryChange={setSummary}
            onSummarySave={onSummarySave}
            onGenerateSummary={onGenerateSummary}
            isGeneratingSummary={isGeneratingSummary}
          />
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
