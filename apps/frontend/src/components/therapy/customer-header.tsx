import type { CustomerOut, SessionOut } from "@/api/generated/types.gen";
import { Calendar, Hash } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface CustomerHeaderProps {
  customer: CustomerOut;
  session: SessionOut;
}

export function CustomerHeader({ customer, session }: CustomerHeaderProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="border-b bg-background px-6 py-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Pacientes
        </Link>
        <span>/</span>
        <Link
          to="/customers/$customerId/sessions/$sessionId"
          params={{ customerId: customer.id, sessionId: session.id }}
          className="hover:text-foreground"
        >
          {customer.name}
        </Link>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              {formatDate(session.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Hash className="size-4" />
              Sessão {session.session_number}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
