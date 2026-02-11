-- 1. Ensure the column exists with the correct type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='operatori_network' 
        AND column_name='note'
        AND table_schema='public'
    ) THEN
        ALTER TABLE public.operatori_network ADD COLUMN note TEXT;
    END IF;
END $$;

-- 2. Grant permissions explicitly to ensure accessibility
GRANT ALL ON public.operatori_network TO postgres;
GRANT ALL ON public.operatori_network TO anon;
GRANT ALL ON public.operatori_network TO authenticated;
GRANT ALL ON public.operatori_network TO service_role;

-- 3. Force PostgREST schema cache reload via NOTIFY
-- We do this multiple times to be sure
NOTIFY pgrst, 'reload schema';

-- 4. Another trick: update a comment on the table
COMMENT ON TABLE public.operatori_network IS 'Tabella operatori network - Ultimo aggiornamento schema: ' || now();

-- 5. Force a reload by creating and immediately dropping a dummy view
-- This often triggers a more thorough schema cache refresh in PostgREST
CREATE OR REPLACE VIEW public.operatori_network_dummy_view AS SELECT * FROM public.operatori_network;
DROP VIEW public.operatori_network_dummy_view;

NOTIFY pgrst, 'reload schema';