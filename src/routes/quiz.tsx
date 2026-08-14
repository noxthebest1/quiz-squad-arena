import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/game/store";
import { DIFFICULTY_LABEL } from "@/lib/game/quizzes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz — Quiz Squad" },
      { name: "description", content: "Indovinelli e trabocchetti: medio, difficile e impossibile. 1 ticket = 1 quiz." },
      { property: "og:title", content: "Quiz — Quiz Squad" },
      { property: "og:description", content: "Rispondi ai trabocchetti del giorno e guadagna punti e crediti." },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const {
    hydrated,
    state,
    nextQuiz,
    nextDifficulty,
    ticketsLeft,
    bonusLeft,
    canWatchVideo,
    watchVideo,
    answerQuiz,
  } = useGame();
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; points: number; credits: number } | null>(null);
  const [watching, setWatching] = useState(false);

  if (!hydrated) return <p className="text-muted-foreground">Caricamento…</p>;

  if (!state.team) {
    return (
      <div className="card-fun space-y-3 p-6 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="text-2xl">Prima scegli la squadra</h1>
        <p className="text-sm text-muted-foreground">
          I quiz si sbloccano dopo aver confermato la squadra stagionale della settimana.
        </p>
        <Button asChild className="rounded-xl font-bold">
          <Link to="/squadra">Scegli la squadra</Link>
        </Button>
      </div>
    );
  }

  if (!nextQuiz) {
    return (
      <div className="card-fun space-y-4 p-6 text-center">
        <p className="text-4xl">🎟️</p>
        <h1 className="text-2xl">Ticket esauriti</h1>
        <p className="text-sm text-muted-foreground">
          {canWatchVideo
            ? `Guarda un video per sbloccare un ticket bonus (${state.bonusUnlocked}/3 usati oggi).`
            : "Torna domani per 5 nuovi ticket gratuiti."}
        </p>
        {canWatchVideo && (
          <Button
            className="rounded-xl font-bold"
            disabled={watching}
            onClick={() => {
              setWatching(true);
              window.setTimeout(() => {
                watchVideo();
                setWatching(false);
              }, 1800);
            }}
          >
            {watching ? "Video in corso…" : "Guarda video 📺 (+1 ticket)"}
          </Button>
        )}
      </div>
    );
  }

  const quiz = nextQuiz;

  function confirm() {
    if (selected === null || result) return;
    const correct = selected === quiz.answer;
    answerQuiz(quiz, correct);
    setResult({ correct, points: correct ? quiz.points : 0, credits: correct ? quiz.credits : 0 });
  }

  function next() {
    setSelected(null);
    setResult(null);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-extrabold uppercase",
              nextDifficulty === "medio" && "bg-success text-success-foreground",
              nextDifficulty === "difficile" && "bg-coin text-coin-foreground",
              nextDifficulty === "impossibile" && "bg-primary text-primary-foreground",
            )}
          >
            {nextDifficulty ? DIFFICULTY_LABEL[nextDifficulty] : ""}
          </span>
        </div>
        <span className="shrink-0 text-xs font-bold text-muted-foreground">
          🎟️ {ticketsLeft} gratis · ⚡ {bonusLeft} bonus
        </span>
      </div>

      <div className="card-fun p-6">
        <h1 className="text-xl leading-snug">{quiz.question}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          In palio: ⭐ {quiz.points} punti · 🪙 {quiz.credits} crediti
        </p>

        <div className="mt-5 grid gap-3">
          {quiz.options.map((opt, i) => {
            const isPicked = selected === i;
            const reveal = result !== null;
            const isRight = i === quiz.answer;
            return (
              <button
                key={i}
                disabled={reveal}
                onClick={() => setSelected(i)}
                className={cn(
                  "rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-colors",
                  !reveal && isPicked && "border-primary bg-primary/10",
                  !reveal && !isPicked && "border-border bg-muted/40 hover:border-primary/60",
                  reveal && isRight && "border-success bg-success/20",
                  reveal && !isRight && isPicked && "border-destructive bg-destructive/15",
                  reveal && !isRight && !isPicked && "border-border opacity-60",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {!result ? (
          <Button
            className="mt-5 w-full rounded-xl font-extrabold"
            size="lg"
            disabled={selected === null}
            onClick={confirm}
          >
            Conferma risposta
          </Button>
        ) : (
          <div
            className={cn(
              "mt-5 rounded-2xl border-2 p-4 text-center",
              result.correct ? "border-success bg-success/15" : "border-destructive bg-destructive/10",
            )}
          >
            <p className="font-display text-xl font-extrabold">
              {result.correct ? "Risposta corretta! 🎉" : "Sbagliato! 😅"}
            </p>
            {result.correct && (
              <p className="mt-1 text-sm font-bold">
                +{result.points} punti ⭐ · +{result.credits} crediti 🪙
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{quiz.explanation}</p>
            <Button className="mt-4 rounded-xl font-bold" onClick={next}>
              Continua
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
