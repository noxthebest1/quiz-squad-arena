import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useGame } from "@/lib/game/store";
import {
  adminNewSeason,
  adminResetChat,
  adminResetStreaks,
  adminUpdateStreakPrize,
  adminUpdateWheel,
  adminUpdateTeams,
  adminUpdateSeasonPrizes,
  adminSaveCustomAsset,
  adminDeleteCustomAsset,
} from "@/lib/game/game.functions";
import { catalogWith } from "@/lib/game/catalog";
import type { AppSettings, CustomAsset, WheelPrize } from "@/lib/game/settings";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Pannello Admin — Quiz Squad" },
      { name: "description", content: "Area riservata: gestione chat, ruota, streak e stagioni di Quiz Squad." },
      { property: "og:title", content: "Pannello Admin — Quiz Squad" },
      { property: "og:description", content: "Comandi manuali riservati all'amministratore di Quiz Squad." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, hydrated, settings, refresh } = useGame();
  const [prizes, setPrizes] = useState<WheelPrize[]>(settings.wheelPrizes);
  const [streak, setStreak] = useState(settings.streakPrize);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<string>) {
    setBusy(key);
    setErr(null);
    setMsg(null);
    try {
      setMsg(await fn());
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Operazione non riuscita");
    } finally {
      setBusy(null);
    }
  }

  if (!hydrated) return <p className="text-sm text-muted-foreground">Caricamento…</p>;

  if (!isAdmin) {
    return (
      <div className="card-fun space-y-2 p-6 text-center">
        <p className="text-3xl">🔒</p>
        <h1 className="text-2xl">Area riservata</h1>
        <p className="text-sm text-muted-foreground">Questa pagina è accessibile solo all'amministratore.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl">Pannello Admin</h1>
        <p className="text-sm text-muted-foreground">Stagione attuale: #{settings.season.number}</p>
      </header>

      {msg && <p className="rounded-xl bg-accent/20 px-4 py-2 text-sm font-bold">{msg}</p>}
      {err && <p className="rounded-xl bg-destructive/15 px-4 py-2 text-sm font-bold text-destructive">{err}</p>}

      <section className="card-fun grid gap-3 p-4 sm:grid-cols-3">
        <Button
          variant="outline"
          className="rounded-xl font-bold"
          disabled={busy !== null}
          onClick={() =>
            void run("chat", async () => {
              await adminResetChat();
              return "Chat azzerata.";
            })
          }
        >
          🧹 Reset Chat
        </Button>
        <Button
          variant="outline"
          className="rounded-xl font-bold"
          disabled={busy !== null}
          onClick={() =>
            void run("streaks", async () => {
              await adminResetStreaks();
              return "Streak settimanali azzerate.";
            })
          }
        >
          🔁 Reset Weekly Streak
        </Button>
        <Button
          className="rounded-xl font-bold"
          disabled={busy !== null}
          onClick={() => {
            if (!confirm("Avviare una nuova stagione? Punti, streak e squadre verranno azzerati.")) return;
            void run("season", async () => {
              const res = (await adminNewSeason()) as { season: number };
              return `Nuova stagione avviata: #${res.season}`;
            });
          }}
        >
          🏆 Nuova Stagione
        </Button>
      </section>

      <section className="card-fun space-y-3 p-4">
        <h2 className="font-display text-lg font-extrabold">Aggiorna Ruota</h2>
        <div className="space-y-2">
          {prizes.map((p, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={p.label}
                maxLength={24}
                aria-label={`Etichetta premio ${i + 1}`}
                onChange={(e) =>
                  setPrizes((list) => list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                }
              />
              <Input
                type="number"
                min={0}
                max={1000}
                className="w-28"
                value={p.credits}
                aria-label={`Crediti premio ${i + 1}`}
                onChange={(e) =>
                  setPrizes((list) =>
                    list.map((x, j) => (j === i ? { ...x, credits: Number(e.target.value) || 0 } : x)),
                  )
                }
              />
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={prizes.length <= 2}
                onClick={() => setPrizes((list) => list.filter((_, j) => j !== i))}
                aria-label={`Rimuovi premio ${i + 1}`}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-xl font-bold"
            disabled={prizes.length >= 8}
            onClick={() => setPrizes((list) => [...list, { label: "10 crediti", credits: 10 }])}
          >
            + Aggiungi spicchio
          </Button>
          <Button
            className="rounded-xl font-bold"
            disabled={busy !== null}
            onClick={() =>
              void run("wheel", async () => {
                const next = (await adminUpdateWheel({ data: { prizes } })) as AppSettings;
                setPrizes(next.wheelPrizes);
                return "Ruota aggiornata.";
              })
            }
          >
            💾 Salva ruota
          </Button>
        </div>
      </section>

      <section className="card-fun space-y-3 p-4">
        <h2 className="font-display text-lg font-extrabold">Premio Streak 7 giorni</h2>
        <div className="grid gap-2 sm:grid-cols-[80px_1fr]">
          <Input
            value={streak.emoji}
            maxLength={4}
            aria-label="Emoji premio streak"
            onChange={(e) => setStreak((s) => ({ ...s, emoji: e.target.value }))}
          />
          <Input
            value={streak.label}
            maxLength={40}
            aria-label="Nome premio streak"
            onChange={(e) => setStreak((s) => ({ ...s, label: e.target.value }))}
          />
        </div>
        <Input
          value={streak.description}
          maxLength={140}
          aria-label="Descrizione premio streak"
          onChange={(e) => setStreak((s) => ({ ...s, description: e.target.value }))}
        />
        <Button
          className="rounded-xl font-bold"
          disabled={busy !== null}
          onClick={() =>
            void run("streakPrize", async () => {
              const next = (await adminUpdateStreakPrize({ data: streak })) as AppSettings;
              setStreak(next.streakPrize);
              return "Premio streak aggiornato.";
            })
          }
        >
          💾 Salva premio streak
        </Button>
      </section>
    </div>
  );
}
