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
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            type="number"
            min={0}
            max={5000}
            value={streak.credits ?? 0}
            aria-label="Crediti premio streak"
            onChange={(e) => setStreak((s) => ({ ...s, credits: Number(e.target.value) || 0 }))}
          />
          <select
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            aria-label="Oggetto premio streak"
            value={streak.itemId ?? ""}
            onChange={(e) => setStreak((s) => ({ ...s, itemId: e.target.value || null }))}
          >
            <option value="">Nessun oggetto</option>
            {catalog.all.map((i) => (
              <option key={i.id} value={i.id}>
                {i.kind} · {i.name}
              </option>
            ))}
          </select>
        </div>
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

      <section className="card-fun space-y-3 p-4">
        <h2 className="font-display text-lg font-extrabold">Nomi delle squadre</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["fulmini", "comete"] as const).map((k) => (
            <div key={k} className="flex gap-2">
              <Input
                className="w-20"
                maxLength={4}
                value={teams[k].emoji}
                aria-label={`Emoji squadra ${k}`}
                onChange={(e) => setTeams((t) => ({ ...t, [k]: { ...t[k], emoji: e.target.value } }))}
              />
              <Input
                maxLength={20}
                value={teams[k].name}
                aria-label={`Nome squadra ${k}`}
                onChange={(e) => setTeams((t) => ({ ...t, [k]: { ...t[k], name: e.target.value } }))}
              />
            </div>
          ))}
        </div>
        <Button
          className="rounded-xl font-bold"
          disabled={busy !== null}
          onClick={() =>
            void run("teams", async () => {
              const next = (await adminUpdateTeams({ data: teams })) as AppSettings;
              setTeams(next.teams);
              return "Squadre aggiornate.";
            })
          }
        >
          💾 Salva squadre
        </Button>
      </section>

      <section className="card-fun space-y-3 p-4">
        <h2 className="font-display text-lg font-extrabold">Premi di fine stagione</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-bold text-muted-foreground">
            Cornice Campione
            <select
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
              value={prizesCfg.championFrameId}
              onChange={(e) => setPrizesCfg((p) => ({ ...p, championFrameId: e.target.value }))}
            >
              {catalog.frames.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-bold text-muted-foreground">
            Titolo Squadra vincitrice
            <select
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
              value={prizesCfg.teamTitleId}
              onChange={(e) => setPrizesCfg((p) => ({ ...p, teamTitleId: e.target.value }))}
            >
              {catalog.titles.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {(["champion", "team"] as const).map((k) => (
          <div key={k} className="grid gap-2 sm:grid-cols-[80px_1fr]">
            <Input
              maxLength={4}
              value={showcase[k].emoji}
              aria-label={`Emoji vetrina ${k}`}
              onChange={(e) => setShowcase((s) => ({ ...s, [k]: { ...s[k], emoji: e.target.value } }))}
            />
            <Input
              maxLength={40}
              value={showcase[k].title}
              aria-label={`Titolo vetrina ${k}`}
              onChange={(e) => setShowcase((s) => ({ ...s, [k]: { ...s[k], title: e.target.value } }))}
            />
            <Input
              className="sm:col-span-2"
              maxLength={160}
              value={showcase[k].description}
              aria-label={`Descrizione vetrina ${k}`}
              onChange={(e) => setShowcase((s) => ({ ...s, [k]: { ...s[k], description: e.target.value } }))}
            />
          </div>
        ))}

        <Button
          className="rounded-xl font-bold"
          disabled={busy !== null}
          onClick={() =>
            void run("seasonPrizes", async () => {
              const next = (await adminUpdateSeasonPrizes({
                data: { ...prizesCfg, showcase },
              })) as AppSettings;
              setPrizesCfg(next.seasonPrizes);
              setShowcase(next.showcase);
              return "Premi di stagione aggiornati.";
            })
          }
        >
          💾 Salva premi stagione
        </Button>
      </section>

      <section className="card-fun space-y-4 p-4">
        <h2 className="font-display text-lg font-extrabold">Editor grafico personalizzazioni</h2>

        <div className="grid gap-2 sm:grid-cols-3">
          <label className="space-y-1 text-xs font-bold text-muted-foreground">
            Tipo
            <select
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
              value={draft.kind}
              onChange={(e) =>
                setDraft((d) => ({ ...d, kind: e.target.value as CustomAsset["kind"], crown: false }))
              }
            >
              <option value="avatar">Avatar (emoji)</option>
              <option value="frame">Cornice (classi ring)</option>
              <option value="title">Titolo (testo)</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-bold text-muted-foreground">
            Nome
            <Input maxLength={32} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          </label>
          <label className="space-y-1 text-xs font-bold text-muted-foreground">
            Prezzo (-1 = solo premio)
            <Input
              type="number"
              min={-1}
              max={5000}
              value={draft.price}
              onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) || 0 }))}
            />
          </label>
        </div>

        <label className="block space-y-1 text-xs font-bold text-muted-foreground">
          {draft.kind === "avatar" ? "Emoji" : draft.kind === "frame" ? "Classi cornice (es. ring-4 ring-coin)" : "Testo del titolo"}
          <Input maxLength={120} value={draft.value} onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))} />
        </label>

        {draft.kind === "frame" && (
          <label className="flex items-center gap-2 text-sm font-bold">
            <Checkbox
              checked={Boolean(draft.crown)}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, crown: v === true }))}
            />
            Aggiungi corona 3D animata 👑
          </label>
        )}

        <div className="flex items-center gap-4 rounded-2xl bg-muted/50 p-4">
          <div className="relative">
            {draft.kind === "frame" && draft.crown && (
              <span className="crown-3d text-lg" aria-hidden>
                👑
              </span>
            )}
            <div
              className={cn(
                "grid h-16 w-16 place-items-center rounded-full bg-card text-3xl",
                draft.kind === "frame" ? draft.value || "ring-2 ring-border" : "ring-2 ring-border",
              )}
            >
              {draft.kind === "avatar" ? draft.value || "🙂" : "🦊"}
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-display font-extrabold">{draft.name || "Anteprima"}</p>
            <p className="text-xs text-muted-foreground">
              {draft.kind === "title" ? draft.value || "Titolo" : draft.kind}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-xl font-bold"
            disabled={busy !== null || !draft.name || !draft.value}
            onClick={() =>
              void run("asset", async () => {
                await adminSaveCustomAsset({ data: draft });
                setDraft(EMPTY_DRAFT);
                return "Personalizzazione salvata.";
              })
            }
          >
            💾 Salva personalizzazione
          </Button>
          {draft.id && (
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setDraft(EMPTY_DRAFT)}>
              Annulla modifica
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {settings.customAssets.length === 0 && (
            <p className="text-sm text-muted-foreground">Nessuna personalizzazione creata.</p>
          )}
          {settings.customAssets.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border p-2">
              <div
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card text-xl",
                  a.kind === "frame" ? a.value : "ring-2 ring-border",
                )}
              >
                {a.kind === "avatar" ? a.value : a.kind === "frame" ? "🦊" : "🏷️"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                  {a.name} {a.crown ? "👑" : ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.kind} · {a.price < 0 ? "solo premio" : `${a.price} crediti`}
                </p>
              </div>
              <Button variant="outline" className="rounded-xl" onClick={() => setDraft({ ...a })}>
                ✏️
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={busy !== null}
                onClick={() =>
                  void run("del", async () => {
                    await adminDeleteCustomAsset({ data: { id: a.id } });
                    return "Personalizzazione eliminata.";
                  })
                }
              >
                🗑️
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

