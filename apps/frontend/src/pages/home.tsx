import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { usePatientStore } from "@/lib/patient-store";
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
import { Calendar, ChevronRight, Plus, Users } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
  const { clients, addClient, addSession, getSessionsByClientId } = usePatientStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");

  const handleAddPatient = () => {
    if (newPatientName.trim()) {
      addClient(newPatientName.trim());
      setNewPatientName("");
      setIsDialogOpen(false);
    }
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
                  <Button onClick={handleAddPatient} disabled={!newPatientName.trim()}>
                    Adicionar Paciente
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {clients.map((client) => {
              const sessions = getSessionsByClientId(client.id);
              const latestSession = sessions[0];
              const initials = client.name
                .split(" ")
                .map((n) => n[0])
                .join("");

              return (
                <Card key={client.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                          <CardDescription>{client.email}</CardDescription>
                        </div>
                      </div>
                      {latestSession ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            to="/clients/$clientId/sessions/$sessionId"
                            params={{ clientId: client.id, sessionId: latestSession.id }}
                          >
                            Ver Sessões
                            <ChevronRight className="ml-1 size-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const session = addSession(client.id);
                            void navigate({
                              to: "/clients/$clientId/sessions/$sessionId",
                              params: { clientId: client.id, sessionId: session.id },
                            });
                          }}
                        >
                          <Plus className="mr-1 size-4" />
                          Nova Sessão
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="size-4" />
                        {sessions.length} {sessions.length !== 1 ? "sessões" : "sessão"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-4" />
                        Iniciado em{" "}
                        {new Date(client.startDate).toLocaleDateString("pt-BR", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {latestSession && latestSession.status === "in-progress" && (
                      <div className="mt-3">
                        <button
                          onClick={() =>
                            void navigate({
                              to: "/clients/$clientId/sessions/$sessionId",
                              params: { clientId: client.id, sessionId: latestSession.id },
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                        >
                          <span className="size-2 animate-pulse rounded-full bg-primary" />
                          Sessão Ativa #{latestSession.sessionNumber}
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

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
        </div>
      </main>
    </div>
  );
}
