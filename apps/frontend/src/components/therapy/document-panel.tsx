import type { DocumentType } from "@/lib/types/therapy";
import type { TranscriptEntryOut } from "@/api/generated/types.gen";
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
  transcriptEntries: TranscriptEntryOut[];
  notes: string;
  summary: string;
  onNotesChange: (notes: string) => void;
  onNotesSave?: (notes: string) => void;
  onSummaryChange: (summary: string) => void;
  onSummarySave?: (summary: string) => void;
  onGenerateSummary: () => Promise<void>;
  isGeneratingSummary?: boolean;
}

const documentLabels: Record<DocumentType, { label: string; icon: React.ReactNode }> = {
  transcript: { label: "Transcrição", icon: <MessageSquare className="size-4" /> },
  notes: { label: "Notas Clínicas", icon: <FileText className="size-4" /> },
  summary: { label: "Resumo da Sessão", icon: <Sparkles className="size-4" /> },
};

export function DocumentPanel({
  documentType,
  onDocumentTypeChange,
  transcriptEntries,
  notes,
  summary,
  onNotesChange,
  onNotesSave,
  onSummaryChange,
  onSummarySave,
  onGenerateSummary,
  isGeneratingSummary,
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
        {documentType === "transcript" && <TranscriptView entries={transcriptEntries} />}
        {documentType === "notes" && (
          <NotesEditor value={notes} onChange={onNotesChange} onSave={onNotesSave} />
        )}
        {documentType === "summary" && (
          <SummaryView
            value={summary}
            onChange={onSummaryChange}
            onSave={onSummarySave}
            onGenerate={onGenerateSummary}
            isGenerating={isGeneratingSummary}
          />
        )}
      </div>
    </div>
  );
}
