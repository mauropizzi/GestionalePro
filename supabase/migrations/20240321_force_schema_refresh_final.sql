-- Force schema refresh by altering a column's type to the same type (noop)
ALTER TABLE public.operatori_network ALTER COLUMN note TYPE TEXT;

-- Nudge PostgREST to reload schema
NOTIFY pgrst, 'reload schema';