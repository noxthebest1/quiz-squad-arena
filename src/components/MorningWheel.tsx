import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGame, todayKey } from "@/lib/game/store";

const SLICES = ["5", "10", "15", "20", "30", "50"];
const COLORS = [
  "var(--primary)",
  "var(--accent)",
  "var(--coin)",
  "var(--team-b)",
  "var(--success)",
  "var(--team-a)",
];

export function MorningWheel() {
  const { state, spinWheel, hydrated } = useGame();
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const already = hydrated && state.wheelSpunDay === todayKey();

  const gradient = `conic-gradient(${SLICES.map(
    (_, i) => `${COLORS[i]} ${(i * 360) / SLICES.length}deg ${((i + 1) * 360) / SLICES.length}deg`,
  ).join(", ")})`;

  async function spin() {
    if (already || spinning || !hydrated) return;
    setSpinning(true);
    setAngle((a) => a + 1080 + Math.floor(Math.random() * 360));
    try {
      const reward = await spinWheel();
      await new Promise((r) => window.setTimeout(r, 2000));
      toast.success(`Ruota del Mattino: +${reward} crediti!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Giro non riuscito");
    } finally {
      setSpinning(false);
    }
  }

  return (
    <div className="card-fun flex flex-col items-center gap-4 p-5">
      <div className="text-center">
        <h3 className="text-lg">Ruota del Mattino</h3>
        <p className="text-xs text-muted-foreground">Un giro gratis ogni giorno</p>
      </div>
      <div className="relative grid place-items-center">
        <div className="absolute -top-2 z-10 text-xl">🔻</div>
        <div
          className="h-40 w-40 rounded-full border-4 border-card shadow-pop transition-transform duration-[2000ms] ease-out"
          style={{ background: gradient, transform: `rotate(${angle}deg)` }}
        />
        <div className="absolute grid h-12 w-12 place-items-center rounded-full bg-card text-lg shadow-soft">
          🎡
        </div>
      </div>
      <Button onClick={spin} disabled={already || spinning} className="w-full rounded-xl font-bold">
        {already ? "Giro già usato oggi" : spinning ? "Gira..." : "Gira la ruota"}
      </Button>
    </div>
  );
}
