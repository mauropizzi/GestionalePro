-- This trick usually forces PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- Also ensure the column is there for good measure
ALTER TABLE public.operatori_network ADD COLUMN IF NOT EXISTS note TEXT;

-- Grant permissions if missing
GRANT ALL ON TABLE public.operatori_network TO authenticated;
GRANT ALL ON TABLE public.operatori_network TO service_role;