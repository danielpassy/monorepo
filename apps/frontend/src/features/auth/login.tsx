import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { devLogin, getGoogleLoginUrl } from "@/api/auth";

interface LoginProps {
  authError: string | null;
}

export function LoginView({ authError }: LoginProps) {
  const [email, setEmail] = useState("");
  const [devError, setDevError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleGoogleLogin() {
    window.location.assign(getGoogleLoginUrl());
  }

  async function handleDevLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setDevError(null);
    setLoading(true);

    try {
      await devLogin(email.trim());
      window.location.assign("/");
    } catch {
      setDevError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">Use your Google account to continue</p>
        </div>

        {authError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
            Authentication failed. Please try again.
          </p>
        )}

        <Button className="w-full" variant="outline" onClick={handleGoogleLogin}>
          Login with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or (debug)</span>
          </div>
        </div>

        <form onSubmit={handleDevLogin} className="space-y-3">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          {devError && <p className="text-sm text-destructive">{devError}</p>}
          <Button
            type="submit"
            className="w-full"
            variant="secondary"
            disabled={loading || !email.trim()}
          >
            {loading ? "Signing in..." : "Continue with Email"}
          </Button>
        </form>
      </div>
    </div>
  );
}
