import { useState } from "react";
import type { Session } from "@/lib/types/therapy";
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
  sessions: Session[];
  currentSessionId: string;
  clientId: string;
  onNewSession: () => Session;
  onDeleteSession: (sessionId: string) => void;
}

export function SessionSidebar({
  sessions,
  currentSessionId,
  clientId,
  onNewSession,
  onDeleteSession,
}: SessionSidebarProps) {
  const navigate = useNavigate();
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleNewSession = () => {
    const newSession = onNewSession();
    void navigate({
      to: "/clients/$clientId/sessions/$sessionId",
      params: { clientId, sessionId: newSession.id },
    });
  };

  const handleDeleteSession = () => {
    if (!sessionToDelete) return;

    const isCurrentSession = sessionToDelete.id === currentSessionId;
    onDeleteSession(sessionToDelete.id);
    setSessionToDelete(null);

    // If deleting current session, navigate to the first available session
    if (isCurrentSession) {
      const remainingSessions = sessions.filter((s) => s.id !== sessionToDelete.id);
      if (remainingSessions.length > 0) {
        void navigate({
          to: "/clients/$clientId/sessions/$sessionId",
          params: { clientId, sessionId: remainingSessions[0].id },
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
            <h2 className="text-sm font-semibold text-foreground">Sessions</h2>
            <p className="text-xs text-muted-foreground">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={handleNewSession} title="New Session">
            <Plus className="size-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const isInProgress = session.status === "in-progress";
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
                        Session #{session.sessionNumber}
                      </span>
                      {isInProgress && (
                        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(session.date)}
                      </span>
                      {session.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {session.duration}m
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Ellipsis menu - appears on hover */}
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
                          Delete Session
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}

            {sessions.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <p>No sessions yet</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleNewSession}>
                  <Plus className="mr-2 size-4" />
                  Create First Session
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Session #{sessionToDelete?.sessionNumber}? This will
              permanently remove all notes, transcripts, and summaries for this session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
