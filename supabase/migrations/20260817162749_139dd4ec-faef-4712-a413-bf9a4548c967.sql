ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS streak_frozen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS streak_prize_season integer NOT NULL DEFAULT 0;