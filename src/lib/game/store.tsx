import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { BONUS_ORDER, FREE_ORDER, QUIZZES, type Difficulty, type Quiz } from "./quizzes";
import { TEAMS, catalogWith, frameHasCrown, type TeamId } from "./catalog";
import { EMPTY_MISSIONS, type MissionId } from "./missions";
import { DEFAULT_SETTINGS, type AppSettings } from "./settings";
import {
  answerQuiz as answerQuizFn,
  buyItem as buyItemFn,
  changeNickname as changeNicknameFn,
  chooseTeam as chooseTeamFn,
  claimMission as claimMissionFn,
  equipItem as equipItemFn,
  fetchGameState,
  registerChat as registerChatFn,
  startQuiz as startQuizFn,
  abandonQuiz as abandonQuizFn,
  spinWheel as spinWheelFn,
  watchVideo as watchVideoFn,
} from "./game.functions";

export type { MissionId };

export type GameState = {
  nickname: string;
  avatarId: string;
  frameId: string;
  titleId: string;
  owned: string[];
  points: number;
  credits: number;
  day: string | null;
  freeUsed: number;
  bonusUnlocked: number;
  bonusUsed: number;
  answeredQuizIds: string[];
  team: TeamId | null;
  teamWeek: string | null;
  wheelSpunDay: string | null;
  streakDays: number;
  missions: Record<MissionId, number>;
  claimedMissions: string[];
  chatSent: number;
  activeQuizId: string | null;
  streakFrozen: boolean;
};

const EMPTY_STATE: GameState = {
  nickname: "Sfidante",
  avatarId: "av-fox",
  frameId: "fr-basic",
  titleId: "ti-novice",
  owned: ["av-fox", "fr-basic", "ti-novice"],
  points: 0,
  credits: 0,
  day: null,
  freeUsed: 0,
  bonusUnlocked: 0,
  bonusUsed: 0,
  answeredQuizIds: [],
  team: null,
  teamWeek: null,
  wheelSpunDay: null,
  streakDays: 0,
  missions: { ...EMPTY_MISSIONS },
  claimedMissions: [],
  chatSent: 0,
  activeQuizId: null,
  streakFrozen: false,
};

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function weekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
}

export function isMonday(d = new Date()) {
  return d.getDay() === 1;
}

type Snapshot = {
  profile: {
    id: string;
    nickname: string;
    avatar_id: string;
    frame_id: string;
    title_id: string;
    points: number;
    credits: number;
    day: string | null;
    free_used: number;
    bonus_unlocked: number;
    bonus_used: number;
    answered_quiz_ids: string[];
    team: TeamId | null;
    team_week: string | null;
    wheel_spun_day: string | null;
    streak_days: number;
    missions: Record<string, number>;
    claimed_missions: string[];
    chat_sent: number;
    active_quiz_id: string | null;
    streak_frozen?: boolean;
  };
  owned: string[];
  settings: AppSettings;
  isAdmin: boolean;
};

function toState(snap: Snapshot): GameState {
  const p = snap.profile;
  return {
    nickname: p.nickname,
    avatarId: p.avatar_id,
    frameId: p.frame_id,
    titleId: p.title_id,
    owned: snap.owned,
    points: p.points,
    credits: p.credits,
    day: p.day,
    freeUsed: p.free_used,
    bonusUnlocked: p.bonus_unlocked,
    bonusUsed: p.bonus_used,
    answeredQuizIds: p.answered_quiz_ids ?? [],
    team: p.team,
    teamWeek: p.team_week,
    wheelSpunDay: p.wheel_spun_day,
    streakDays: p.streak_days,
    missions: { ...EMPTY_MISSIONS, ...(p.missions ?? {}) } as Record<MissionId, number>,
    claimedMissions: p.claimed_missions ?? [],
    chatSent: p.chat_sent,
    activeQuizId: p.active_quiz_id ?? null,
    streakFrozen: Boolean(p.streak_frozen),
  };
}

type Ctx = {
  hydrated: boolean;
  authReady: boolean;
  user: User | null;
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
  settings: AppSettings;
  isAdmin: boolean;
  teams: Record<TeamId, { id: TeamId; name: string; emoji: string; colorClass: string }>;
  frameCrown: boolean;
  applySnapshot: (snap: unknown) => void;
  startQuiz: () => Promise<void>;
  abandonQuiz: () => Promise<void>;
  refresh: () => Promise<void>;
  answer: (quiz: Quiz, optionIndex: number) => Promise<{ correct: boolean; points: number; credits: number }>;
  watchVideo: () => Promise<void>;
  buy: (itemId: string) => Promise<void>;
  equip: (itemId: string) => Promise<void>;
  setNickname: (name: string) => Promise<void>;
  chooseTeam: (team: TeamId) => Promise<void>;
  spinWheel: () => Promise<number>;
  sendChat: () => Promise<void>;
  claimMission: (missionId: MissionId) => Promise<{ reward: number; points: number }>;
  signOut: () => Promise<void>;
};

const GameContext = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isAdmin, setIsAdmin] = useState(false);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    const snap = (await fetchGameState()) as Snapshot;
    setState(toState(snap));
    setSettings(snap.settings ?? DEFAULT_SETTINGS);
    setIsAdmin(Boolean(snap.isAdmin));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      loadedFor.current = null;
      setState(EMPTY_STATE);
      setHydrated(false);
      return;
    }
    if (loadedFor.current === user.id) return;
    loadedFor.current = user.id;
    void refresh().catch((error) => {
      console.error(error);
      loadedFor.current = null;
    });
  }, [authReady, user, refresh]);

  const apply = useCallback((snap: Snapshot) => {
    setState(toState(snap));
    if (snap.settings) setSettings(snap.settings);
    setIsAdmin(Boolean(snap.isAdmin));
  }, []);

  const ticketsLeft = Math.max(0, 5 - state.freeUsed);
  const bonusLeft = Math.max(0, state.bonusUnlocked - state.bonusUsed);
  const canWatchVideo = ticketsLeft === 0 && state.bonusUnlocked < 3;

  const nextDifficulty: Difficulty | null = useMemo(() => {
    if (ticketsLeft > 0) return FREE_ORDER[state.freeUsed] ?? null;
    if (bonusLeft > 0) return BONUS_ORDER[state.bonusUsed] ?? null;
    return null;
  }, [ticketsLeft, bonusLeft, state.freeUsed, state.bonusUsed]);

  const activeQuiz = useMemo(
    () => (state.activeQuizId ? (QUIZZES.find((q) => q.id === state.activeQuizId) ?? null) : null),
    [state.activeQuizId],
  );

  const nextQuiz = useMemo(() => {
    if (activeQuiz) return activeQuiz;
    if (!nextDifficulty) return null;
    return QUIZZES.find((q) => q.difficulty === nextDifficulty && !state.answeredQuizIds.includes(q.id)) ?? null;
  }, [activeQuiz, nextDifficulty, state.answeredQuizIds]);

  const startQuiz = useCallback(async () => {
    apply((await startQuizFn()) as Snapshot);
  }, [apply]);

  const abandonQuiz = useCallback(async () => {
    apply((await abandonQuizFn()) as Snapshot);
  }, [apply]);

  const answer = useCallback(
    async (quiz: Quiz, optionIndex: number) => {
      const res = (await answerQuizFn({ data: { quizId: quiz.id, optionIndex } })) as {
        correct: boolean;
        points: number;
        credits: number;
        state: Snapshot;
      };
      apply(res.state);
      return { correct: res.correct, points: res.points, credits: res.credits };
    },
    [apply],
  );

  const watchVideo = useCallback(async () => {
    apply((await watchVideoFn()) as Snapshot);
  }, [apply]);

  const buy = useCallback(
    async (itemId: string) => {
      apply((await buyItemFn({ data: { itemId } })) as Snapshot);
    },
    [apply],
  );

  const equip = useCallback(
    async (itemId: string) => {
      apply((await equipItemFn({ data: { itemId } })) as Snapshot);
    },
    [apply],
  );

  const setNickname = useCallback(
    async (name: string) => {
      apply((await changeNicknameFn({ data: { nickname: name } })) as Snapshot);
    },
    [apply],
  );

  const chooseTeamAction = useCallback(
    async (team: TeamId) => {
      apply((await chooseTeamFn({ data: { team } })) as Snapshot);
    },
    [apply],
  );

  const spinWheel = useCallback(async () => {
    const res = (await spinWheelFn()) as { reward: number; state: Snapshot };
    apply(res.state);
    return res.reward;
  }, [apply]);

  const sendChat = useCallback(async () => {
    apply((await registerChatFn()) as Snapshot);
  }, [apply]);

  const claimMission = useCallback(
    async (missionId: MissionId) => {
      const res = (await claimMissionFn({ data: { missionId } })) as {
        reward: number;
        points: number;
        state: Snapshot;
      };
      apply(res.state);
      return { reward: res.reward, points: res.points };
    },
    [apply],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setState(EMPTY_STATE);
    setIsAdmin(false);
    setHydrated(false);
  }, []);

  const catalog = catalogWith(settings.customAssets);
  const avatar = catalog.avatars.find((a) => a.id === state.avatarId)?.value ?? "🦊";
  const frameClass = catalog.frames.find((f) => f.id === state.frameId)?.value ?? "ring-2 ring-border";
  const title = catalog.titles.find((t) => t.id === state.titleId)?.value ?? "Novellino";
  const frameCrown = frameHasCrown(state.frameId, settings.customAssets);
  const teams = {
    fulmini: { ...TEAMS.fulmini, ...settings.teams.fulmini },
    comete: { ...TEAMS.comete, ...settings.teams.comete },
  };

  const value: Ctx = {
    hydrated,
    authReady,
    user,
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
    settings,
    isAdmin,
    teams,
    frameCrown,
    applySnapshot: (snap: unknown) => apply(snap as Snapshot),
    startQuiz,
    abandonQuiz,
    refresh,
    answer,
    watchVideo,
    buy,
    equip,
    setNickname,
    chooseTeam: chooseTeamAction,
    spinWheel,
    sendChat,
    claimMission,
    signOut,
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
