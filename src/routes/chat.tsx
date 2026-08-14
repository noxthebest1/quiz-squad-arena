import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PlayerChip } from "@/components/PlayerChip";
import { useGame } from "@/lib/game/store";
import { RIVALS } from "@/lib/game/roster";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat — Quiz Squad" },
      { name: "description", content: "Chat sicura con messaggi e sticker pre-impostati: niente testo libero." },
      { property: "og:title", content: "Chat — Quiz Squad" },
      { property: "og:description", content: "Interagisci con la squadra usando frasi e sticker approvati." },
    ],
  }),
  component: ChatPage,
});

const PRESETS = [
  "Ciao squadra! 👋",
  "Forza ragazzi! 💪",
  "Che trabocchetto assurdo!",
  "Ce l'ho fatta! 🎉",
  "Serve aiuto qui 🙃",
  "Buona fortuna a tutti!",
];

const STICKERS = ["🔥", "🎉", "🤯", "😂", "👏", "🧠", "⚡", "☄️"];

type Msg = { id: string; author: string; avatar: string; frameClass: string; title: string; team: any; text: string };

const SEED: Msg[] = RIVALS.slice(0, 4).map((r, i) => ({
  id: `s${i}`,
  author: r.name,
  avatar: r.avatar,
  frameClass: r.frameClass,
  title: r.title,
  team: r.team,
  text: [PRESETS[1], STICKERS[0], PRESETS[2], STICKERS[5]][i] ?? "🔥",
}));

function ChatPage() {
  const { state, avatar, frameClass, title, sendChat, hydrated } = useGame();
  const [messages, setMessages] = useState<Msg[]>(SEED);

  function send(text: string) {
    void sendChat().catch(() => undefined);
    setMessages((m) => [
      ...m,
      { id: `${Date.now()}`, author: state.nickname, avatar, frameClass, title, team: state.team, text },
    ]);
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl">Chat</h1>
        <p className="text-sm text-muted-foreground">
          Scrittura libera disabilitata: usa solo messaggi e sticker pre-impostati.
        </p>
      </header>

      <div className="card-fun flex h-[420px] flex-col gap-4 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col gap-1">
            <PlayerChip
              name={m.author}
              avatar={m.avatar}
              frameClass={m.frameClass}
              title={m.title}
              team={m.team}
              size="sm"
            />
            <p className="ml-12 w-fit max-w-full rounded-2xl bg-muted px-4 py-2 text-sm font-semibold break-words">
              {m.text}
            </p>
          </div>
        ))}
      </div>

      <div className="card-fun space-y-3 p-4">
        <p className="text-xs font-bold uppercase text-muted-foreground">Messaggi rapidi</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button key={p} variant="outline" size="sm" className="rounded-full font-bold" onClick={() => send(p)}>
              {p}
            </Button>
          ))}
        </div>
        <p className="text-xs font-bold uppercase text-muted-foreground">Sticker</p>
        <div className="flex flex-wrap gap-2">
          {STICKERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="grid h-11 w-11 place-items-center rounded-xl border-2 border-border bg-muted text-xl transition-transform hover:-translate-y-0.5"
              aria-label={`Invia sticker ${s}`}
            >
              {s}
            </button>
          ))}
        </div>
        {hydrated && (
          <p className="text-[11px] text-muted-foreground">Messaggi inviati oggi: {state.chatSent}</p>
        )}
      </div>
    </div>
  );
}
