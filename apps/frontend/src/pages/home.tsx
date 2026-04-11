import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/therapy/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Plus, Users } from "lucide-react";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useCreateSession } from "@/hooks/useSessions";
import { getClientInitials } from "./home.logic";

export default function HomePage() {
  const navigate = useNavigate();
  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");

  const handleAddPatient = () => {
    if (!newPatientName.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    createClient.mutate(
      { name: newPatientName.trim(), start_date: today },
      {
        onSuccess: () => {
          setNewPatientName("");
          setIsDialogOpen(false);
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <AppHeader />

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
              <p className="text-sm text-muted-foreground">
                Selecione um paciente para ver seu histórico de sessões
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  Novo Paciente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Paciente</DialogTitle>
                  <DialogDescription>
                    Digite o nome do paciente para criar o perfil.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Nome do paciente"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddPatient();
                    }}
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddPatient}
                    disabled={!newPatientName.trim() || createClient.isPending}
                  >
                    Adicionar Paciente
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <div className="grid gap-4">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  clientId={client.id}
                  clientName={client.name}
                  clientEmail={client.email}
                  clientStartDate={client.start_date}
                  onNavigate={(sessionId) =>
                    void navigate({
                      to: "/clients/$clientId/sessions/$sessionId",
                      params: { clientId: client.id, sessionId },
                    })
                  }
                />
              ))}

              {clients.length === 0 && (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <Users className="mx-auto size-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">Nenhum paciente ainda</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Adicione seu primeiro paciente para começar a documentar as sessões.
                  </p>
                  <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 size-4" />
                    Adicionar Paciente
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface ClientCardProps {
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  clientStartDate: string;
  onNavigate: (sessionId: string) => void;
}

function ClientCard({
  clientId,
  clientName,
  clientEmail,
  clientStartDate,
  onNavigate,
}: ClientCardProps) {
  const createSession = useCreateSession(clientId);
  const initials = getClientInitials(clientName);

  const handleNewSession = () => {
    const today = new Date().toISOString().split("T")[0];
    createSession.mutate({ date: today }, { onSuccess: (session) => onNavigate(session.id) });
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{clientName}</CardTitle>
              {clientEmail && <CardDescription>{clientEmail}</CardDescription>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewSession}
            disabled={createSession.isPending}
          >
            <Plus className="mr-1 size-4" />
            Nova Sessão
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" />
            Iniciado em{" "}
            {new Date(clientStartDate).toLocaleDateString("pt-BR", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
