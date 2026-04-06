import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { TranscriptionSetup } from "./transcription-setup";

export function AppHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          TherapyNotes
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Patients</Link>
          </Button>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <TranscriptionSetup />
        <Button variant="ghost" size="icon-sm">
          <Bell className="size-4" />
        </Button>
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">DS</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
