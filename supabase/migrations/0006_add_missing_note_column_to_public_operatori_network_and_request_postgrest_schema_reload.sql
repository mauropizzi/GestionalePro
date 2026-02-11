ALTER TABLE public.operatori_network
ADD COLUMN IF NOT EXISTS note text;

COMMENT ON COLUMN public.operatori_network.note IS 'Note dell''operatore';

-- Ask PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
