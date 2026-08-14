import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fetchGameState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const engine = await import("./engine.server");
    const email = (context.claims as { email?: string } | null)?.email ?? "";
    const profile = await engine.loadProfile(context.userId, email.split("@")[0] ?? "Sfidante");
    return await engine.snapshot(context.userId, profile);
  });

export const answerQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ quizId: z.string(), optionIndex: z.number().int().min(0) }).parse(input))
  .handler(async ({ data, context }) => {
    const engine = await import("./engine.server");
    const { QUIZZES, FREE_ORDER, BONUS_ORDER } = await import("./quizzes");

    let profile = await engine.loadProfile(context.userId, "Sfidante");
    const quiz = QUIZZES.find((q) => q.id === data.quizId);
    if (!quiz) throw new Error("Quiz non trovato");
    if (!profile.team) throw new Error("Devi prima scegliere la squadra");
    if (profile.answered_quiz_ids.includes(quiz.id)) throw new Error("Quiz già giocato");

    const usingFree = profile.free_used < 5;
    const expected = usingFree
      ? FREE_ORDER[profile.free_used]
      : BONUS_ORDER[profile.bonus_used];
    const bonusLeft = profile.bonus_unlocked - profile.bonus_used;
    if (!usingFree && bonusLeft <= 0) throw new Error("Nessun ticket disponibile");
    if (!expected || quiz.difficulty !== expected) throw new Error("Quiz non valido per questo ticket");

    const correct = data.optionIndex === quiz.answer;
    const missions = {
      ...profile.missions,
      play3: (profile.missions.play3 ?? 0) + 1,
      correct2: (profile.missions.correct2 ?? 0) + (correct ? 1 : 0),
    };

    profile = await engine.patchProfile(context.userId, {
      free_used: usingFree ? profile.free_used + 1 : profile.free_used,
      bonus_used: usingFree ? profile.bonus_used : profile.bonus_used + 1,
      answered_quiz_ids: [...profile.answered_quiz_ids, quiz.id],
      points: profile.points + (correct ? quiz.points : 0),
      credits: profile.credits + (correct ? quiz.credits : 0),
      missions,
    });

    return {
      correct,
      answer: quiz.answer,
      points: correct ? quiz.points : 0,
      credits: correct ? quiz.credits : 0,
      state: await engine.snapshot(context.userId, profile),
    };
  });

export const watchVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const engine = await import("./engine.server");
    let profile = await engine.loadProfile(context.userId, "Sfidante");
    if (profile.free_used < 5 || profile.bonus_unlocked >= 3) throw new Error("Bonus non disponibile");
    profile = await engine.patchProfile(context.userId, { bonus_unlocked: profile.bonus_unlocked + 1 });
    return await engine.snapshot(context.userId, profile);
  });

export const spinWheel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const engine = await import("./engine.server");
    let profile = await engine.loadProfile(context.userId, "Sfidante");
    if (profile.wheel_spun_day === engine.todayISO()) throw new Error("Giro già usato oggi");

    const rewards = [5, 10, 15, 20, 30, 50];
    const index = Math.floor(Math.random() * rewards.length);
    const reward = rewards[index] ?? 5;

    profile = await engine.patchProfile(context.userId, {
      wheel_spun_day: engine.todayISO(),
      credits: profile.credits + reward,
      missions: { ...profile.missions, spin: 1 },
    });

    return { reward, index, state: await engine.snapshot(context.userId, profile) };
  });

export const claimMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ missionId: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const engine = await import("./engine.server");
    const { findMission } = await import("./missions");

    let profile = await engine.loadProfile(context.userId, "Sfidante");
    const mission = findMission(data.missionId);
    if (!mission) throw new Error("Missione inesistente");
    if (profile.claimed_missions.includes(mission.id)) throw new Error("Ricompensa già riscattata");
    if ((profile.missions[mission.id] ?? 0) < mission.goal) throw new Error("Missione non ancora completata");

    profile = await engine.patchProfile(context.userId, {
      credits: profile.credits + mission.reward,
      points: profile.points + mission.points,
      claimed_missions: [...profile.claimed_missions, mission.id],
    });

    return { reward: mission.reward, points: mission.points, state: await engine.snapshot(context.userId, profile) };
  });

export const buyItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ itemId: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const engine = await import("./engine.server");
    const { findItem } = await import("./catalog");

    let profile = await engine.loadProfile(context.userId, "Sfidante");
    const item = findItem(data.itemId);
    if (!item) throw new Error("Oggetto inesistente");
    if (item.price < 0) throw new Error("Oggetto riservato ai premi di fine stagione");
    if (profile.credits < item.price) throw new Error("Crediti insufficienti");

    const owned = await engine.getOwned(context.userId);
    if (owned.includes(item.id)) throw new Error("Oggetto già posseduto");

    await engine.grantItem(context.userId, item.id);
    const patch: Record<string, number | string> = { credits: profile.credits - item.price };
    if (item.kind === "avatar") patch["avatar_id"] = item.id;
    if (item.kind === "frame") patch["frame_id"] = item.id;
    if (item.kind === "title") patch["title_id"] = item.id;
    profile = await engine.patchProfile(context.userId, patch);

    return await engine.snapshot(context.userId, profile);
  });

export const equipItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ itemId: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const engine = await import("./engine.server");
    const { findItem } = await import("./catalog");

    const item = findItem(data.itemId);
    if (!item) throw new Error("Oggetto inesistente");

    const owned = await engine.getOwned(context.userId);
    if (!owned.includes(item.id)) throw new Error("Oggetto non posseduto");

    const patch: Record<string, string> = {};
    if (item.kind === "avatar") patch["avatar_id"] = item.id;
    else if (item.kind === "frame") patch["frame_id"] = item.id;
    else if (item.kind === "title") patch["title_id"] = item.id;
    else throw new Error("Oggetto non equipaggiabile");

    const profile = await engine.patchProfile(context.userId, patch);
    return await engine.snapshot(context.userId, profile);
  });

export const changeNickname = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ nickname: z.string().min(1).max(32) }).parse(input))
  .handler(async ({ data, context }) => {
    const engine = await import("./engine.server");
    const { NICKNAME_TOKEN } = await import("./catalog");

    let profile = await engine.loadProfile(context.userId, "Sfidante");
    const clean = engine.sanitizeNickname(data.nickname);
    if (clean.length < 3) throw new Error("Nickname troppo corto");
    if (profile.credits < NICKNAME_TOKEN.price) throw new Error("Crediti insufficienti");

    profile = await engine.patchProfile(context.userId, {
      nickname: clean,
      credits: profile.credits - NICKNAME_TOKEN.price,
    });
    return await engine.snapshot(context.userId, profile);
  });

export const chooseTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ team: z.enum(["fulmini", "comete"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const engine = await import("./engine.server");
    let profile = await engine.loadProfile(context.userId, "Sfidante");
    if (profile.team && profile.team_week === engine.weekISO()) throw new Error("Squadra già bloccata per questa settimana");
    profile = await engine.patchProfile(context.userId, { team: data.team, team_week: engine.weekISO() });
    return await engine.snapshot(context.userId, profile);
  });

export const registerChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const engine = await import("./engine.server");
    let profile = await engine.loadProfile(context.userId, "Sfidante");
    profile = await engine.patchProfile(context.userId, {
      chat_sent: profile.chat_sent + 1,
      missions: { ...profile.missions, chat: 1 },
    });
    return await engine.snapshot(context.userId, profile);
  });
