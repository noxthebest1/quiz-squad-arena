import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BONUS_ORDER, FREE_ORDER, QUIZZES, type Difficulty, type Quiz } from "./quizzes";
import { AVATARS, FRAMES, TITLES, TEAMS, findItem, type TeamId } from "./catalog";

const STORAGE_KEY = "quiz-squad-state-v1";

export type MissionId = "play3" | "correct2" | "spin" | "chat";

export type GameState = {
  nickname: string;
  avatarId: string;
  frameId: string;
  titleId: string;
  owned: string[];
  points: number;
  credits: number;
  day: string; // ISO date of the current daily cycle
  freeUsed: number;
  bonusUnlocked: number;
  bonusUsed: number;
  answeredQuizIds: string[];
  team: TeamId | null;
  teamWeek: string | null;
  wheelSpunDay: string | null;
  streakDays: number;
  missions: Record<MissionId, number>;
  chatSent: string[];
};

const DEFAULT_STATE: GameState = {
  nickname: "Sfidante",
  avatarId: "av-fox",
  frameId: "fr-basic",
  titleId: "ti-novice",
  owned: ["av-fox", "fr-basic", "ti-novice"],
  points: 0,
  credits: 120,
  day: "",
  freeUsed: 0,
  bonusUnlocked: 0,
  bonusUsed: 0,
  answeredQuizIds: [],
  team: null,
  teamWeek: null,
  wheelSpunDay: null,
  streakDays: 3,
  missions: { play3: 0, correct2: 0, spin: 0, chat: 0 },
  chatSent: [],
};

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function weekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (date.getUTCDay() + 6) % 7; // monday = 0
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
}

export function isMonday(d = new Date()) {
  return d.getDay() === 1;
}

type Ctx = {
  hydrated: boolean;
  state: GameState;
  avatar: string;
  frameClass: string;
  title: string;
  ticketsLeft: number;
  bonusLeft: number;
  canWatchVideo: boolean;
  nextQuiz: Quiz | null;
  nextDifficulty: Difficulty | null;
  teamLocked: boolean;
  answerQuiz: (quiz: Quiz, correct: boolean) => void;
  watchVideo: () => void;
  buy: (itemId: string) => boolean;
  equip: (itemId: string) => void;
  setNickname: (name: string) => void;
  chooseTeam: (team: TeamId) => void;
  spinWheel: () => number;
  sendChat: (text: string) => void;
};

const GameContext = createContext<Ctx | null>(null);

function normalize(state: GameState): GameState {
  const today = todayKey();
  let next = state;
  if (state.day !== today) {
    next = {
      ...state,
      day: today,
      freeUsed: 0,
      bonusUnlocked: 0,
      bonusUsed: 0,
      missions: { play3: 0, correct2: 0, spin: 0, chat: 0 },
    };
  }
  if (state.teamWeek !== weekKey()) {
    next = { ...next, team: null, teamWeek: null };
  }
  return next;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? ({ ...DEFAULT_STATE, ...JSON.parse(raw) } as GameState) : DEFAULT_STATE;
      setState(normalize(parsed));
    } catch {
      setState(normalize(DEFAULT_STATE));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, hydrated]);

  const ticketsLeft = Math.max(0, 5 - state.freeUsed);
  const bonusLeft = Math.max(0, state.bonusUnlocked - state.bonusUsed);
  const canWatchVideo = ticketsLeft === 0 && state.bonusUnlocked < 3;

  const nextDifficulty: Difficulty | null = useMemo(() => {
    if (ticketsLeft > 0) return FREE_ORDER[state.freeUsed] ?? null;
    if (bonusLeft > 0) return BONUS_ORDER[state.bonusUsed] ?? null;
    return null;
  }, [ticketsLeft, bonusLeft, state.freeUsed, state.bonusUsed]);

  const nextQuiz = useMemo(() => {
    if (!nextDifficulty) return null;
    return (
      QUIZZES.find((q) => q.difficulty === nextDifficulty && !state.answeredQuizIds.includes(q.id)) ?? null
    );
  }, [nextDifficulty, state.answeredQuizIds]);

  const answerQuiz = useCallback((quiz: Quiz, correct: boolean) => {
    setState((s) => {
      if (s.answeredQuizIds.includes(quiz.id)) return s;
      const usingFree = s.freeUsed < 5;
      return {
        ...s,
        freeUsed: usingFree ? s.freeUsed + 1 : s.freeUsed,
        bonusUsed: usingFree ? s.bonusUsed : s.bonusUsed + 1,
        answeredQuizIds: [...s.answeredQuizIds, quiz.id],
        points: s.points + (correct ? quiz.points : 0),
        credits: s.credits + (correct ? quiz.credits : 0),
        missions: {
          ...s.missions,
          play3: s.missions.play3 + 1,
          correct2: s.missions.correct2 + (correct ? 1 : 0),
        },
      };
    });
  }, []);

  const watchVideo = useCallback(() => {
    setState((s) => {
      if (s.freeUsed < 5 || s.bonusUnlocked >= 3) return s;
      return { ...s, bonusUnlocked: s.bonusUnlocked + 1 };
    });
  }, []);

  const buy = useCallback((itemId: string) => {
    let ok = false;
    setState((s) => {
      const item = findItem(itemId);
      if (!item || item.price < 0 || s.credits < item.price) return s;
      if (item.kind !== "nickname" && s.owned.includes(itemId)) return s;
      ok = true;
      return {
        ...s,
        credits: s.credits - item.price,
        owned: item.kind === "nickname" ? s.owned : [...s.owned, itemId],
      };
    });
    return ok;
  }, []);

  const equip = useCallback((itemId: string) => {
    setState((s) => {
      const item = findItem(itemId);
      if (!item || !s.owned.includes(itemId)) return s;
      if (item.kind === "avatar") return { ...s, avatarId: itemId };
      if (item.kind === "frame") return { ...s, frameId: itemId };
      if (item.kind === "title") return { ...s, titleId: itemId };
      return s;
    });
  }, []);

  const setNickname = useCallback((name: string) => {
    const clean = name.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 16);
    if (clean.trim().length < 3) return;
    setState((s) => ({ ...s, nickname: clean.trim() }));
  }, []);

  const chooseTeam = useCallback((team: TeamId) => {
    setState((s) => (s.team ? s : { ...s, team, teamWeek: weekKey() }));
  }, []);

  const spinWheel = useCallback(() => {
    const rewards = [5, 10, 15, 20, 30, 50];
    const reward = rewards[Math.floor(Math.random() * rewards.length)] ?? 5;
    setState((s) => {
      if (s.wheelSpunDay === todayKey()) return s;
      return {
        ...s,
        wheelSpunDay: todayKey(),
        credits: s.credits + reward,
        missions: { ...s.missions, spin: 1 },
      };
    });
    return reward;
  }, []);

  const sendChat = useCallback((text: string) => {
    setState((s) => ({
      ...s,
      chatSent: [...s.chatSent, text].slice(-40),
      missions: { ...s.missions, chat: 1 },
    }));
  }, []);

  const avatar = AVATARS.find((a) => a.id === state.avatarId)?.value ?? "🦊";
  const frameClass = FRAMES.find((f) => f.id === state.frameId)?.value ?? "ring-2 ring-border";
  const title = TITLES.find((t) => t.id === state.titleId)?.value ?? "Novellino";

  const value: Ctx = {
    hydrated,
    state,
    avatar,
    frameClass,
    title,
    ticketsLeft,
    bonusLeft,
    canWatchVideo,
    nextQuiz,
    nextDifficulty,
    teamLocked: state.team !== null,
    answerQuiz,
    watchVideo,
    buy,
    equip,
    setNickname,
    chooseTeam,
    spinWheel,
    sendChat,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame deve essere usato dentro GameProvider");
  return ctx;
}

export { TEAMS };
export type { TeamId };
