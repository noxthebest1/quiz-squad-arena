CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL DEFAULT 'Sfidante',
  avatar_id TEXT NOT NULL DEFAULT 'av-fox',
  frame_id TEXT NOT NULL DEFAULT 'fr-basic',
  title_id TEXT NOT NULL DEFAULT 'ti-novice',
  points INTEGER NOT NULL DEFAULT 0,
  credits INTEGER NOT NULL DEFAULT 120,
  day DATE,
  free_used INTEGER NOT NULL DEFAULT 0,
  bonus_unlocked INTEGER NOT NULL DEFAULT 0,
  bonus_used INTEGER NOT NULL DEFAULT 0,
  answered_quiz_ids TEXT[] NOT NULL DEFAULT '{}',
  team TEXT CHECK (team IN ('fulmini','comete')),
  team_week DATE,
  wheel_spun_day DATE,
  streak_days INTEGER NOT NULL DEFAULT 0,
  missions JSONB NOT NULL DEFAULT '{"play3":0,"correct2":0,"spin":0,"chat":0}'::jsonb,
  claimed_missions TEXT[] NOT NULL DEFAULT '{}',
  chat_sent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

GRANT SELECT ON public.inventory TO authenticated;
GRANT ALL ON public.inventory TO service_role;

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own inventory"
  ON public.inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX inventory_user_id_idx ON public.inventory (user_id);
CREATE INDEX profiles_points_idx ON public.profiles (points DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();