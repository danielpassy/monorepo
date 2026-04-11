import { useState } from "react";
import type { SessionOut } from "@/api/generated/types.gen";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link, useNavigate } from "@tanstack/react-router";
import { Calendar, Clock, MoreHorizontal, Plus, Trash2 } from "lucide-react";

interface SessionSidebarProps {
  sessions: SessionOut[];
  currentSessionId: string;
  clientId: string;
  onNewSession: () => Promise<SessionOut>;
  onDeleteSession: (sessionId: string) => Promise<void>;
}

export function SessionSidebar({
  sessions,
  currentSessionId,
  clientId,
  onNewSession,
  onDeleteSession,
}: SessionSidebarProps) {
  const navigate = useNavigate();
  const [sessionToDelete, setSessionToDelete] = useState<SessionOut | null>(null);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleNewSession = async () => {
    const newSession = await onNewSession();
    void navigate({
      to: "/clients/$clientId/sessions/$sessionId",
      params: { clientId, sessionId: newSession.id },
    });
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    const isCurrentSession = sessionToDelete.id === currentSessionId;
    await onDeleteSession(sessionToDelete.id);
    setSessionToDelete(null);

    if (isCurrentSession) {
      const remaining = sessions.filter((s) => s.id !== sessionToDelete.id);
      if (remaining.length > 0) {
        void navigate({
          to: "/clients/$clientId/sessions/$sessionId",
          params: { clientId, sessionId: remaining[0].id },
        });
      } else {
        void navigate({ to: "/" });
      }
    }
  };

  return (
    <>
      <div className="flex h-full w-64 flex-col border-r bg-muted/30">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Sessões</h2>
            <p className="text-xs text-muted-foreground">
              {sessions.length} {sessions.length !== 1 ? "sessões" : "sessão"} registradas
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => void handleNewSession()}
            title="Nova Sessão"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const isHovered = hoveredSessionId === session.id;

              return (
                <div
                  key={session.id}
                  className={cn(
                    "group relative flex flex-col gap-1 rounded-md px-3 py-2.5 transition-colors",
                    isActive ? "bg-background shadow-sm" : "hover:bg-background/50",
                  )}
                  onMouseEnter={() => setHoveredSessionId(session.id)}
                  onMouseLeave={() => setHoveredSessionId(null)}
                >
                  <Link
                    to="/clients/$clientId/sessions/$sessionId"
                    params={{ clientId, sessionId: session.id }}
                    className="flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isActive ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        Sessão #{session.session_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(session.date)}
                      </span>
                      {session.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {session.duration_minutes}m
                        </span>
                      )}
                    </div>
                  </Link>

                  <div
                    className={cn(
                      "absolute right-2 top-2 transition-opacity",
                      isHovered || isActive ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-6"
                          onClick={(e) => e.preventDefault()}
                        >
                          <MoreHorizontal className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            setSessionToDelete(session);
                          }}
                        >
                          <Trash2 className="size-4" />
                          Excluir Sessão
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}

            {sessions.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <p>Nenhuma sessão ainda</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => void handleNewSession()}
                >
                  <Plus className="mr-2 size-4" />
                  Criar Primeira Sessão
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Sessão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a Sessão #{sessionToDelete?.session_number}? Isso irá
              remover permanentemente todas as notas, transcrições e resumos desta sessão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteSession()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
