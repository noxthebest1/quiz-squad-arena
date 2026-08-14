export type MissionId = "play3" | "correct2" | "spin" | "chat";

export type MissionDef = {
  id: MissionId;
  label: string;
  goal: number;
  reward: number;
  points: number;
  icon: string;
};

export const MISSIONS: MissionDef[] = [
  { id: "play3", label: "Gioca 3 quiz", goal: 3, reward: 15, points: 5, icon: "🎯" },
  { id: "correct2", label: "Indovina 2 quiz", goal: 2, reward: 25, points: 10, icon: "🧠" },
  { id: "spin", label: "Gira la Ruota del Mattino", goal: 1, reward: 10, points: 2, icon: "🎡" },
  { id: "chat", label: "Invia un messaggio in chat", goal: 1, reward: 5, points: 1, icon: "💬" },
];

export function findMission(id: string) {
  return MISSIONS.find((m) => m.id === id);
}

export const EMPTY_MISSIONS: Record<MissionId, number> = {
  play3: 0,
  correct2: 0,
  spin: 0,
  chat: 0,
};
