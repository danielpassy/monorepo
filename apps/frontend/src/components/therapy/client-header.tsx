import type { Client, Session } from "@/lib/types/therapy";
import { Calendar, Hash, Radio } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface ClientHeaderProps {
  client: Client;
  session: Session;
}

export function ClientHeader({ client, session }: ClientHeaderProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="border-b bg-background px-6 py-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Patients
        </Link>
        <span>/</span>
        <Link
          to="/clients/$clientId/sessions/$sessionId"
          params={{ clientId: client.id, sessionId: session.id }}
          className="hover:text-foreground"
        >
          {client.name}
        </Link>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              {formatDate(session.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Hash className="size-4" />
              Session {session.sessionNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session.status === "in-progress" && (
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm">
              <Radio className={cn("size-4 text-primary", "animate-pulse")} />
              <span className="font-medium text-primary">Active Session</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
