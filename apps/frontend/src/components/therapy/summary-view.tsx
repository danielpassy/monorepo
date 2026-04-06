import { useState } from "react";
import type { TranscriptEntry } from "@/lib/types/therapy";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Check } from "lucide-react";
import { generateSummary } from "@/lib/mock-ai";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SummaryViewProps {
  value: string;
  onChange: (value: string) => void;
  transcript: TranscriptEntry[];
  notes: string;
}

export function SummaryView({ value, onChange, transcript, notes }: SummaryViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const summary = await generateSummary(transcript, notes);
      setLocalValue(summary);
      onChange(summary);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  // Empty state - no summary yet
  if (!value && !localValue && !isGenerating) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="rounded-full bg-muted p-4">
          <Sparkles className="size-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="font-medium">Nenhum Resumo Gerado</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Gere um resumo por IA com base na transcrição da sessão e nas suas notas clínicas.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          <Sparkles className="mr-2 size-4" />
          Gerar Resumo
        </Button>
        <p className="text-xs text-muted-foreground">Você pode editar o resumo após a geração</p>
      </div>
    );
  }

  // Loading state
  if (isGenerating) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="rounded-full bg-muted p-4">
          <RefreshCw className="size-8 animate-spin text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="font-medium">Gerando Resumo</h3>
          <p className="mt-1 text-sm text-muted-foreground">Analisando transcrição e notas...</p>
        </div>
      </div>
    );
  }

  // Summary exists - show editable view
  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Check className="size-3" />
          <span>Resumo gerado por IA (editável)</span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <RefreshCw className="mr-2 size-3" />
              Regenerar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Regenerar Resumo?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso irá substituir o resumo atual por um novo gerado. Qualquer edição que você
                tenha feito será perdida.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRegenerate}>Regenerar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <textarea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            "h-full w-full resize-none bg-transparent p-4 text-sm leading-relaxed",
            "placeholder:text-muted-foreground",
            "focus:outline-none",
          )}
          placeholder="O resumo aparecerá aqui..."
        />
      </div>
    </div>
  );
}
