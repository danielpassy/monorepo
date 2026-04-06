import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotesEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function NotesEditor({ value, onChange }: NotesEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Auto-save with debounce
  useEffect(() => {
    if (localValue !== value) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(() => {
        onChange(localValue);
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [localValue, value, onChange]);

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end);
    const newText =
      localValue.substring(0, start) + prefix + selectedText + suffix + localValue.substring(end);

    setLocalValue(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertBullet = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const textBefore = localValue.substring(0, start);
    const lineStart = textBefore.lastIndexOf("\n") + 1;
    const currentLine = localValue.substring(lineStart, start);

    if (currentLine.startsWith("• ")) {
      // Remove bullet if already there
      const newText =
        localValue.substring(0, lineStart) + currentLine.substring(2) + localValue.substring(start);
      setLocalValue(newText);
    } else {
      // Add bullet at line start
      const newText = localValue.substring(0, lineStart) + "• " + localValue.substring(lineStart);
      setLocalValue(newText);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => insertFormatting("**")}
            title="Bold"
          >
            <Bold className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => insertFormatting("_")}
            title="Italic"
          >
            <Italic className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={insertBullet} title="Bullet List">
            <List className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isSaving ? (
            <span>Saving...</span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1">
              <Check className="size-3" />
              Saved
            </span>
          ) : null}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className={cn(
            "h-full w-full resize-none bg-transparent p-4 text-sm leading-relaxed",
            "placeholder:text-muted-foreground",
            "focus:outline-none",
          )}
          placeholder="Enter your clinical notes here..."
        />
      </div>
    </div>
  );
}
