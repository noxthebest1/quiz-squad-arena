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
    const { QUIZZES } = await import("./quizzes");

    let profile = await engine.loadProfile(context.userId, "Sfidante");
    const quiz = QUIZZES.find((q) => q.id === data.quizId);
    if (!quiz) throw new Error("Quiz non trovato");
    if (!profile.team) throw new Error("Devi prima scegliere la squadra");
    if (profile.active_quiz_id !== quiz.id) throw new Error("Nessun quiz attivo: usa un ticket per iniziare");

    const correct = data.optionIndex === quiz.answer;
    const missions = {
      ...profile.missions,
      play3: (profile.missions.play3 ?? 0) + 1,
      correct2: (profile.missions.correct2 ?? 0) + (correct ? 1 : 0),
    };

    profile = await engine.patchProfile(context.userId, {
      answered_quiz_ids: [...profile.answered_quiz_ids, quiz.id],
      points: profile.points + (correct ? quiz.points : 0),
      credits: profile.credits + (correct ? quiz.credits : 0),
      missions,
      active_quiz_id: null,
      active_quiz_started_at: null,
    });

    return {
      correct,
      answer: quiz.answer,
      points: correct ? quiz.points : 0,
      credits: correct ? quiz.credits : 0,
      state: await engine.snapshot(context.userId, profile),
    };
  });

/** Consuma 1 ticket e apre il quiz. Se esiste già un quiz attivo lo riprende. */
export const startQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const engine = await import("./engine.server");
    const { QUIZZES, FREE_ORDER, BONUS_ORDER } = await import("./quizzes");

    let profile = await engine.loadProfile(context.userId, "Sfidante");
    if (!profile.team) throw new Error("Devi prima scegliere la squadra");
    if (profile.active_quiz_id) return await engine.snapshot(context.userId, profile);

    const usingFree = profile.free_used < 5;
    const bonusLeft = profile.bonus_unlocked - profile.bonus_used;
    if (!usingFree && bonusLeft <= 0) throw new Error("Nessun ticket disponibile");

    const expected = usingFree ? FREE_ORDER[profile.free_used] : BONUS_ORDER[profile.bonus_used];
    if (!expected) throw new Error("Nessun ticket disponibile");

    const quiz = QUIZZES.find((q) => q.difficulty === expected && !profile.answered_quiz_ids.includes(q.id));
    if (!quiz) throw new Error("Nessun quiz disponibile per oggi");

    profile = await engine.patchProfile(context.userId, {
      free_used: usingFree ? profile.free_used + 1 : profile.free_used,
      bonus_used: usingFree ? profile.bonus_used : profile.bonus_used + 1,
      active_quiz_id: quiz.id,
      active_quiz_started_at: new Date().toISOString(),
    });
    return await engine.snapshot(context.userId, profile);
  });

/** Uscita prima di completare: il ticket resta consumato e il quiz non è più giocabile. */
export const abandonQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const engine = await import("./engine.server");
    let profile = await engine.loadProfile(context.userId, "Sfidante");
    if (!profile.active_quiz_id) return await engine.snapshot(context.userId, profile);
    profile = await engine.patchProfile(context.userId, {
      answered_quiz_ids: [...profile.answered_quiz_ids, profile.active_quiz_id],
      active_quiz_id: null,
      active_quiz_started_at: null,
    });
    return await engine.snapshot(context.userId, profile);
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

    const settings = await engine.getSettings();
    const prizes = settings.wheelPrizes.length ? settings.wheelPrizes : [{ label: "5 crediti", credits: 5 }];
    const index = Math.floor(Math.random() * prizes.length);
    const reward = prizes[index]?.credits ?? 5;


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
    const { findItemIn } = await import("./catalog");

    let profile = await engine.loadProfile(context.userId, "Sfidante");
    const settings = await engine.getSettings();
    const item = findItemIn(data.itemId, settings.customAssets);
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
    const { findItemIn } = await import("./catalog");

    const settings = await engine.getSettings();
    const item = findItemIn(data.itemId, settings.customAssets);
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

/* ---------------- Chat persistente ---------------- */

export const listChatMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const engine = await import("./engine.server");
    return await engine.listChat(60);
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ text: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data, context }) => {
    const engine = await import("./engine.server");
    const { isAllowedChatMessage } = await import("./chat-presets");
    if (!isAllowedChatMessage(data.text)) throw new Error("Messaggio non consentito");

    let profile = await engine.loadProfile(context.userId, "Sfidante");
    await engine.insertChat({
      user_id: context.userId,
      nickname: profile.nickname,
      avatar_id: profile.avatar_id,
      frame_id: profile.frame_id,
      title_id: profile.title_id,
      team: profile.team,
      text: data.text,
    });

    profile = await engine.patchProfile(context.userId, {
      chat_sent: profile.chat_sent + 1,
      missions: { ...profile.missions, chat: 1 },
    });

    return {
      messages: await engine.listChat(60),
      state: await engine.snapshot(context.userId, profile),
    };
  });

/* ---------------- Pannello admin ---------------- */

export const adminResetChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const engine = await import("./engine.server");
    await engine.assertAdmin(context.userId);
    await engine.resetChat();
    return { ok: true };
  });

export const adminUpdateWheel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        prizes: z
          .array(z.object({ label: z.string().min(1).max(24), credits: z.number().int().min(0).max(1000) }))
          .min(2)
          .max(8),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const engine = await import("./engine.server");
    await engine.assertAdmin(context.userId);
    await engine.setSetting("wheel_prizes_next", data.prizes);
    return await engine.getNextSettings();
  });

export const adminUpdateStreakPrize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        emoji: z.string().min(1).max(4),
        label: z.string().min(1).max(40),
        description: z.string().min(1).max(140),
        credits: z.number().int().min(0).max(5000).optional(),
        itemId: z.string().max(40).nullable().optional(),
      })

      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const engine = await import("./engine.server");
    await engine.assertAdmin(context.userId);
    await engine.setSetting("streak_prize_next", data);
    return await engine.getNextSettings();
  });

export const adminResetStreaks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const engine = await import("./engine.server");
    await engine.assertAdmin(context.userId);
    await engine.resetStreaks();
    return { ok: true };
  });

export const adminNewSeason = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const engine = await import("./engine.server");
    await engine.assertAdmin(context.userId);
    const { season, award } = await engine.startNewSeason();
    return { season, award };
  });

export const adminUpdateTeams = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        fulmini: z.object({ name: z.string().min(1).max(20), emoji: z.string().min(1).max(4) }),
        comete: z.object({ name: z.string().min(1).max(20), emoji: z.string().min(1).max(4) }),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const engine = await import("./engine.server");
    await engine.assertAdmin(context.userId);
    await engine.setSetting("teams", data);
    return await engine.getSettings();
  });

export const adminUpdateSeasonPrizes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        championFrameId: z.string().min(1).max(40),
        teamTitleId: z.string().min(1).max(40),
        showcase: z.object({
          champion: z.object({
            emoji: z.string().min(1).max(4),
            title: z.string().min(1).max(40),
            description: z.string().min(1).max(160),
          }),
          team: z.object({
            emoji: z.string().min(1).max(4),
            title: z.string().min(1).max(40),
            description: z.string().min(1).max(160),
          }),
        }),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const engine = await import("./engine.server");
    await engine.assertAdmin(context.userId);
    await engine.setSetting("season_prizes_next", {
      championFrameId: data.championFrameId,
      teamTitleId: data.teamTitleId,
    });
    await engine.setSetting("showcase", data.showcase);
    return await engine.getNextSettings();

  });

const customAssetSchema = z.object({
  id: z.string().max(40).optional(),
  kind: z.enum(["avatar", "frame", "title"]),
  name: z.string().min(1).max(32),
  price: z.number().int().min(-1).max(5000),
  value: z.string().min(1).max(120),
  crown: z.boolean().optional(),
});

export const adminSaveCustomAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => customAssetSchema.parse(input))
  .handler(async ({ data, context }) => {
    const engine = await import("./engine.server");
    await engine.assertAdmin(context.userId);
    const settings = await engine.getSettings();
    const id = data.id && data.id.startsWith("cu-") ? data.id : `cu-${Math.random().toString(36).slice(2, 10)}`;
    const asset = { ...data, id, crown: data.kind === "frame" ? Boolean(data.crown) : false };
    const list = settings.customAssets.filter((a) => a.id !== id);
    await engine.setSetting("custom_assets", [...list, asset]);
    return await engine.getSettings();
  });

export const adminDeleteCustomAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().min(1).max(40) }).parse(input))
  .handler(async ({ data, context }) => {
    const engine = await import("./engine.server");
    await engine.assertAdmin(context.userId);
    const settings = await engine.getSettings();
    await engine.setSetting(
      "custom_assets",
      settings.customAssets.filter((a) => a.id !== data.id),
    );
    return await engine.getSettings();
  });

/* ---------------- Classifica reale (server-authoritative) ---------------- */

export const fetchLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const engine = await import("./engine.server");
    const [players, counts] = await Promise.all([engine.listLeaderboard(), engine.teamMemberCounts()]);
    return { players, counts };
  });

/** Valori programmati (_next) visibili solo all'admin nell'editor. */
export const adminFetchNextSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const engine = await import("./engine.server");
    await engine.assertAdmin(context.userId);
    return await engine.getNextSettings();
  });
