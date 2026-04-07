import type { TranscriptEntry } from "@/lib/types/therapy";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptViewProps {
  entries: TranscriptEntry[];
}

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
          <TranscriptMessage key={entry.id} entry={entry} />
        ))}
      </div>
    </ScrollArea>
  );
}

function TranscriptMessage({ entry }: { entry: TranscriptEntry }) {
  const isTherapist = entry.speaker === "therapist";

  return (
    <div className={cn("flex flex-col gap-1", isTherapist ? "items-start" : "items-end")}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium">{isTherapist ? entry.speakerName : entry.speakerName}</span>
        <span>{entry.timestamp}</span>
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed",
          isTherapist ? "bg-muted text-foreground" : "bg-primary/10 text-foreground",
        )}
      >
        {entry.content}
      </div>
    </div>
  );
}
