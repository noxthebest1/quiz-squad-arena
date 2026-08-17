export type WheelPrize = { label: string; credits: number };
export type StreakPrize = {
  emoji: string;
  label: string;
  description: string;
  credits?: number;
  itemId?: string | null;
};
export type ShowcaseEntry = { emoji: string; title: string; description: string };

/** Personalizzazione grafica creata dall'admin (salvata in app_settings.custom_assets). */
export type CustomAsset = {
  id: string;
  kind: "avatar" | "frame" | "title";
  name: string;
  price: number; // -1 = riservato ai premi
  value: string; // emoji (avatar) · classi ring (cornice) · testo (titolo)
  crown?: boolean; // solo cornici: corona 3D animata
};

export type TeamConfig = { name: string; emoji: string };

export type SeasonPrizes = {
  championFrameId: string;
  teamTitleId: string;
};

export type AppSettings = {
  wheelPrizes: WheelPrize[];
  streakPrize: StreakPrize;
  showcase: { champion: ShowcaseEntry; team: ShowcaseEntry };
  season: { number: number };
  teams: { fulmini: TeamConfig; comete: TeamConfig };
  seasonPrizes: SeasonPrizes;
  customAssets: CustomAsset[];
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
    credits: 100,
    itemId: "fr-gold",
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
  teams: {
    fulmini: { name: "Fulmini", emoji: "⚡" },
    comete: { name: "Comete", emoji: "☄️" },
  },
  seasonPrizes: {
    championFrameId: "fr-champion",
    teamTitleId: "ti-season",
  },
  customAssets: [],
};
