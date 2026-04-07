import type { DocumentType, SessionDocuments, TranscriptEntry } from "@/lib/types/therapy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, MessageSquare, Sparkles } from "lucide-react";
import { TranscriptView } from "./transcript-view";
import { NotesEditor } from "./notes-editor";
import { SummaryView } from "./summary-view";

interface DocumentPanelProps {
  documentType: DocumentType;
  onDocumentTypeChange: (type: DocumentType) => void;
  documents: SessionDocuments;
  onNotesChange: (notes: string) => void;
  onSummaryChange: (summary: string) => void;
  clientName: string;
}

const documentLabels: Record<DocumentType, { label: string; icon: React.ReactNode }> = {
  transcript: { label: "Transcrição", icon: <MessageSquare className="size-4" /> },
  notes: { label: "Notas Clínicas", icon: <FileText className="size-4" /> },
  summary: { label: "Resumo da Sessão", icon: <Sparkles className="size-4" /> },
};

export function DocumentPanel({
  documentType,
  onDocumentTypeChange,
  documents,
  onNotesChange,
  onSummaryChange,
  clientName,
}: DocumentPanelProps) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Select value={documentType} onValueChange={(v) => onDocumentTypeChange(v as DocumentType)}>
          <SelectTrigger className="w-[200px] border-0 bg-transparent shadow-none focus:ring-0">
            <div className="flex items-center gap-2">
              {documentLabels[documentType].icon}
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="transcript">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4" />
                Transcrição
              </div>
            </SelectItem>
            <SelectItem value="notes">
              <div className="flex items-center gap-2">
                <FileText className="size-4" />
                Notas Clínicas
              </div>
            </SelectItem>
            <SelectItem value="summary">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4" />
                Resumo da Sessão
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-hidden">
        {documentType === "transcript" && <TranscriptView entries={documents.transcript} />}
        {documentType === "notes" && (
          <NotesEditor value={documents.notes} onChange={onNotesChange} />
        )}
        {documentType === "summary" && (
          <SummaryView
            value={documents.summary}
            onChange={onSummaryChange}
            transcript={documents.transcript}
            notes={documents.notes}
          />
        )}
      </div>
    </div>
  );
}
