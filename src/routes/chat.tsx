import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PlayerChip } from "@/components/PlayerChip";
import { useGame } from "@/lib/game/store";
import { AVATARS, FRAMES, TITLES, type TeamId } from "@/lib/game/catalog";
import { CHAT_PRESETS, CHAT_STICKERS } from "@/lib/game/chat-presets";
import { listChatMessages, sendChatMessage } from "@/lib/game/game.functions";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat — Quiz Squad" },
      { name: "description", content: "Chat sicura con messaggi e sticker pre-impostati: niente testo libero." },
      { property: "og:title", content: "Chat — Quiz Squad" },
      { property: "og:description", content: "Interagisci con la squadra usando frasi e sticker approvati." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

type ChatRow = {
  id: string;
  user_id: string;
  nickname: string;
  avatar_id: string;
  frame_id: string;
  title_id: string;
  team: string | null;
  text: string;
  created_at: string;
};

function avatarOf(id: string) {
  return AVATARS.find((a) => a.id === id)?.value ?? "🦊";
}
function frameOf(id: string) {
  return FRAMES.find((f) => f.id === id)?.value ?? "ring-2 ring-border";
}
function titleOf(id: string) {
  return TITLES.find((t) => t.id === id)?.value ?? "Novellino";
}

function ChatPage() {
  const { state, hydrated, user, applySnapshot } = useGame();
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const rows = (await listChatMessages()) as ChatRow[];
      setMessages(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore di caricamento chat");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void load();
    const timer = setInterval(() => void load(), 8000);
    return () => clearInterval(timer);
  }, [user, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(text: string) {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const res = (await sendChatMessage({ data: { text } })) as { messages: ChatRow[]; state: unknown };
      setMessages(res.messages);
      applySnapshot(res.state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invio non riuscito");
    } finally {
      setSending(false);
    }
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
        {loading && <p className="text-sm text-muted-foreground">Caricamento messaggi…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Nessun messaggio: rompi il ghiaccio! 👋</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col gap-1">
            <PlayerChip
              name={m.nickname}
              avatar={avatarOf(m.avatar_id)}
              frameClass={frameOf(m.frame_id)}
              title={titleOf(m.title_id)}
              team={(m.team as TeamId | null) ?? null}
              size="sm"
            />
            <p className="ml-12 w-fit max-w-full rounded-2xl bg-muted px-4 py-2 text-sm font-semibold break-words">
              {m.text}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="card-fun space-y-3 p-4">
        <p className="text-xs font-bold uppercase text-muted-foreground">Messaggi rapidi</p>
        <div className="flex flex-wrap gap-2">
          {CHAT_PRESETS.map((p) => (
            <Button
              key={p}
              variant="outline"
              size="sm"
              className="rounded-full font-bold"
              disabled={sending}
              onClick={() => void send(p)}
            >
              {p}
            </Button>
          ))}
        </div>
        <p className="text-xs font-bold uppercase text-muted-foreground">Sticker</p>
        <div className="flex flex-wrap gap-2">
          {CHAT_STICKERS.map((s) => (
            <button
              key={s}
              onClick={() => void send(s)}
              disabled={sending}
              className="grid h-11 w-11 place-items-center rounded-xl border-2 border-border bg-muted text-xl transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              aria-label={`Invia sticker ${s}`}
            >
              {s}
            </button>
          ))}
        </div>
        {error && <p className="text-xs font-bold text-destructive">{error}</p>}
        {hydrated && (
          <p className="text-[11px] text-muted-foreground">Messaggi inviati oggi: {state.chatSent}</p>
        )}
      </div>
    </div>
  );
}
