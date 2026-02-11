-- Fix operatori_network schema and refresh PostgREST cache
-- First, let's make sure the note column exists
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

-- Update the note column to ensure it's properly configured
ALTER TABLE public.operatori_network 
ALTER COLUMN note SET DEFAULT NULL,
ALTER COLUMN note DROP NOT NULL;

-- Force PostgREST to reload the schema by touching a system table
NOTIFY pgrst, 'reload schema';

-- Additional force: recreate the table comments
COMMENT ON TABLE public.operatori_network IS 'Network operators table - schema refresh';
COMMENT ON COLUMN public.operatori_network.note IS 'Notes about the network operator';

-- Verify the column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'operatori_network' 
AND table_schema = 'public'
AND column_name = 'note';

RAISE LOG 'operatori_network schema refresh completed';