-- Ensure the note column exists
ALTER TABLE public.operatori_network 
ADD COLUMN IF NOT EXISTS note TEXT;

-- Nudge PostgREST schema cache (this is a common trick in Supabase to force a reload)
-- By altering a dummy comment or similar
COMMENT ON TABLE public.operatori_network IS 'Tabella per gli operatori del network';