import type { TranscriptEntryOut } from "@/api/generated/types.gen";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface TranscriptViewProps {
  entries: TranscriptEntryOut[];
}

const statusLabel: Record<string, string> = {
  waiting_to_be_processed: "Aguardando processamento",
  processing: "Processando",
  processed: "Processado",
  failed: "Falhou",
};

export function TranscriptView({ entries }: TranscriptViewProps) {
  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Nenhuma transcrição disponível para esta sessão.</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            As transcrições são geradas automaticamente durante sessões ativas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {entries.map((entry) => (
          <TranscriptEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </ScrollArea>
  );
}

function TranscriptEntryCard({ entry }: { entry: TranscriptEntryOut }) {
  const isProcessed = entry.status === "processed";
  const isFailed = entry.status === "failed";

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {new Date(entry.created_at).toLocaleString("pt-BR")}
        </span>
        <Badge
          variant={isProcessed ? "default" : isFailed ? "destructive" : "secondary"}
          className="text-xs"
        >
          {statusLabel[entry.status] ?? entry.status}
        </Badge>
      </div>
      {isProcessed && entry.transcript ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.transcript}</p>
      ) : (
        <p className={cn("text-sm text-muted-foreground", isFailed && "text-destructive")}>
          {isFailed ? "Falha ao processar o áudio." : "Aguardando processamento do áudio..."}
        </p>
      )}
    </div>
  );
}
