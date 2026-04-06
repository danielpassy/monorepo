

import { useState, useCallback } from "react";
import type { DocumentType, Session } from "@/lib/types/therapy";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { DocumentPanel } from "./document-panel";

interface SessionWorkspaceProps {
  session: Session;
  clientName: string;
}

const COLLAPSE_THRESHOLD = 15;

export function SessionWorkspace({ session, clientName }: SessionWorkspaceProps) {
  // Shared document state - both panels reference this
  const [documents, setDocuments] = useState(session.documents);

  // Each panel can show a different document type
  const [leftDocumentType, setLeftDocumentType] = useState<DocumentType>("transcript");
  const [rightDocumentType, setRightDocumentType] = useState<DocumentType>("notes");

  // Panel visibility based on collapse
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const handleNotesChange = useCallback((notes: string) => {
    setDocuments((prev) => ({ ...prev, notes }));
  }, []);

  const handleSummaryChange = useCallback((summary: string) => {
    setDocuments((prev) => ({ ...prev, summary }));
  }, []);

  const handleLayout = useCallback((sizes: number[]) => {
    // Collapse panels when dragged below threshold
    setLeftCollapsed(sizes[0] < COLLAPSE_THRESHOLD);
    setRightCollapsed(sizes[1] < COLLAPSE_THRESHOLD);
  }, []);

  return (
    <ResizablePanelGroup direction="horizontal" onLayout={handleLayout} className="h-full">
      <ResizablePanel
        defaultSize={50}
        minSize={0}
        collapsible
        collapsedSize={0}
        onCollapse={() => setLeftCollapsed(true)}
        onExpand={() => setLeftCollapsed(false)}
      >
        {!leftCollapsed && (
          <DocumentPanel
            documentType={leftDocumentType}
            onDocumentTypeChange={setLeftDocumentType}
            documents={documents}
            onNotesChange={handleNotesChange}
            onSummaryChange={handleSummaryChange}
            clientName={clientName}
          />
        )}
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel
        defaultSize={50}
        minSize={0}
        collapsible
        collapsedSize={0}
        onCollapse={() => setRightCollapsed(true)}
        onExpand={() => setRightCollapsed(false)}
      >
        {!rightCollapsed && (
          <DocumentPanel
            documentType={rightDocumentType}
            onDocumentTypeChange={setRightDocumentType}
            documents={documents}
            onNotesChange={handleNotesChange}
            onSummaryChange={handleSummaryChange}
            clientName={clientName}
          />
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
