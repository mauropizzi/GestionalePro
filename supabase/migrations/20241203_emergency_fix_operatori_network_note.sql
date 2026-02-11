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
        RAISE NOTICE 'Added note column to operatori_network';
    ELSE
        RAISE NOTICE 'Note column already exists in operatori_network';
    END IF;
END $$;

-- 2. Explicitly grant permissions to all roles
GRANT ALL ON TABLE public.operatori_network TO postgres;
GRANT ALL ON TABLE public.operatori_network TO anon;
GRANT ALL ON TABLE public.operatori_network TO authenticated;
GRANT ALL ON TABLE public.operatori_network TO service_role;

-- 3. Force PostgREST schema cache reload via multiple NOTIFY signals
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 4. Re-touch the table metadata
COMMENT ON TABLE public.operatori_network IS 'Tabella operatori network - Schema forced reload at ' || now();
COMMENT ON COLUMN public.operatori_network.note IS 'Note dell''operatore';

-- 5. Create and drop a dummy view to force a dependency refresh
CREATE OR REPLACE VIEW public.operatori_network_refresh_view AS SELECT * FROM public.operatori_network;
DROP VIEW public.operatori_network_refresh_view;

-- 6. Perform a dummy update on an existing record if any, to trigger any potential write-through cache
UPDATE public.operatori_network SET updated_at = NOW() WHERE id IN (SELECT id FROM public.operatori_network LIMIT 1);