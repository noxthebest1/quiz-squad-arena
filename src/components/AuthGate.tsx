import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGame } from "@/lib/game/store";

export function AuthGate({ children }: { children: ReactNode }) {
  const { authReady, user } = useGame();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!authReady) {
    return <p className="py-16 text-center text-sm font-bold text-muted-foreground">Caricamento…</p>;
  }

  if (user) return <>{children}</>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account creato! Ora sei dentro.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Autenticazione fallita");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Accesso con Google non riuscito");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md space-y-5 py-8">
      <div className="text-center">
        <p className="text-5xl">🧠</p>
        <h1 className="mt-2 text-2xl">Entra in Quiz Squad</h1>
        <p className="text-sm text-muted-foreground">
          Il tuo profilo, i crediti e la squadra sono salvati sul cloud.
        </p>
      </div>

      <form onSubmit={submit} className="card-fun space-y-3 p-5">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-xl"
          autoComplete="email"
        />
        <Input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="rounded-xl"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
        <Button type="submit" disabled={busy} className="w-full rounded-xl font-extrabold" size="lg">
          {mode === "signup" ? "Crea account 🚀" : "Accedi 🎮"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          className="w-full rounded-xl font-bold"
          onClick={google}
        >
          Continua con Google
        </Button>
        <button
          type="button"
          className="w-full text-xs font-bold text-muted-foreground underline"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
        </button>
      </form>
    </div>
  );
}
