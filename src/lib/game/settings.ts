export type WheelPrize = { label: string; credits: number };
export type StreakPrize = { emoji: string; label: string; description: string };
export type ShowcaseEntry = { emoji: string; title: string; description: string };
export type AppSettings = {
  wheelPrizes: WheelPrize[];
  streakPrize: StreakPrize;
  showcase: { champion: ShowcaseEntry; team: ShowcaseEntry };
  season: { number: number };
};

export const DEFAULT_SETTINGS: AppSettings = {
  wheelPrizes: [
    { label: "5 crediti", credits: 5 },
    { label: "10 crediti", credits: 10 },
    { label: "15 crediti", credits: 15 },
    { label: "20 crediti", credits: 20 },
    { label: "30 crediti", credits: 30 },
    { label: "50 crediti", credits: 50 },
  ],
  streakPrize: {
    emoji: "🎁",
    label: "Baule Leggendario",
    description: "100 crediti + cornice esclusiva al 7° giorno di fila",
  },
  showcase: {
    champion: {
      emoji: "🦊",
      title: "Premio Campione",
      description: "Cornice con corona per il 1° della classifica generale.",
    },
    team: {
      emoji: "🎖️",
      title: "Premio Squadra",
      description: "Titolo Squadra Campione per tutti i membri della squadra vincitrice.",
    },
  },
  season: { number: 1 },
};
