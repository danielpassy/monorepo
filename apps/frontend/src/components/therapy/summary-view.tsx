import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Check } from "lucide-react";
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
  onGenerate: () => Promise<void>;
  onSave?: (value: string) => void;
  isGenerating?: boolean;
}

export function SummaryView({
  value,
  onChange,
  onGenerate,
  onSave,
  isGenerating = false,
}: SummaryViewProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (localValue !== value) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(() => {
        onChange(localValue);
        if (onSave) onSave(localValue);
        setIsSaving(false);
        setLastSaved(new Date());
      }, 800);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [localValue, value, onChange, onSave]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
  };

  if (!value && !localValue && !isGenerating) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="rounded-full bg-muted p-4">
          <Sparkles className="size-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="font-medium">Nenhum Resumo Gerado</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Gere um resumo com base nas notas clínicas e transcrições da sessão.
          </p>
        </div>
        <Button onClick={onGenerate} disabled={isGenerating}>
          <Sparkles className="mr-2 size-4" />
          Gerar Resumo
        </Button>
        <p className="text-xs text-muted-foreground">Você pode editar o resumo após a geração</p>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="rounded-full bg-muted p-4">
          <RefreshCw className="size-8 animate-spin text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="font-medium">Gerando Resumo</h3>
          <p className="mt-1 text-sm text-muted-foreground">Analisando notas e transcrições...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Check className="size-3" />
          <span>Resumo gerado (editável)</span>
          {isSaving ? <span>Salvando...</span> : lastSaved ? <span>Salvo</span> : null}
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
              <AlertDialogAction onClick={onGenerate}>Regenerar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

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
