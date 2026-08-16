-- Lettura consentita agli utenti autenticati; nessun privilegio di scrittura dal client.
REVOKE ALL ON public.profiles, public.chat_messages, public.app_settings, public.user_roles, public.inventory FROM anon, authenticated;

GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.chat_messages TO authenticated;
GRANT SELECT ON public.app_settings TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.inventory TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.chat_messages TO service_role;
GRANT ALL ON public.app_settings TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.inventory TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.inventory FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
