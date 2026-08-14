-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'iosononoemi123@gmail.com'
ON CONFLICT DO NOTHING;

-- App settings
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read settings"
ON public.app_settings FOR SELECT TO authenticated
USING (true);

CREATE TRIGGER app_settings_set_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (key, value) VALUES
  ('wheel_prizes', '[{"label":"5 crediti","credits":5},{"label":"10 crediti","credits":10},{"label":"15 crediti","credits":15},{"label":"20 crediti","credits":20},{"label":"30 crediti","credits":30},{"label":"50 crediti","credits":50}]'::jsonb),
  ('streak_prize', '{"emoji":"🎁","label":"Baule Leggendario","description":"100 crediti + cornice esclusiva al 7° giorno di fila"}'::jsonb),
  ('showcase', '{"champion":{"emoji":"🦊","title":"Premio Campione","description":"Cornice con corona per il 1° della classifica generale."},"team":{"emoji":"🎖️","title":"Premio Squadra","description":"Titolo Squadra Campione per tutti i membri della squadra vincitrice."}}'::jsonb),
  ('season', '{"number":1}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Chat messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  avatar_id text NOT NULL,
  frame_id text NOT NULL,
  title_id text NOT NULL,
  team text,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_created_at_idx ON public.chat_messages (created_at);

GRANT SELECT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read chat"
ON public.chat_messages FOR SELECT TO authenticated
USING (true);

-- Quiz in corso (ticket consumato all'apertura)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_quiz_id text,
  ADD COLUMN IF NOT EXISTS active_quiz_started_at timestamptz;
