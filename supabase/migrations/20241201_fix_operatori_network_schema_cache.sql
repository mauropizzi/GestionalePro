-- Ensure the note column exists in operatori_network table
DO $$
BEGIN
    -- Check if note column exists, add it if it doesn't
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'operatori_network' 
        AND column_name = 'note'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.operatori_network ADD COLUMN note TEXT;
        RAISE NOTICE 'Added note column to operatori_network table';
    ELSE
        RAISE NOTICE 'Note column already exists in operatori_network table';
    END IF;
END $$;

-- Force PostgREST schema cache reload
-- This is a more aggressive approach to ensure schema cache is refreshed
NOTIFY pgrst, 'reload schema';

-- Also try the alternative notification method
NOTIFY pgrst, 'reload config';

-- Update the updated_at timestamp to trigger any cache mechanisms
UPDATE public.operatori_network SET updated_at = NOW() WHERE id IS NOT NULL LIMIT 1;

-- Log the operation for debugging
INSERT INTO public.operatori_network (nome, cognome, email, created_at, updated_at)
SELECT 
    'SYSTEM', 
    'SCHEMA_FIX', 
    'schema@fix.com', 
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.operatori_network 
    WHERE email = 'schema@fix.com'
);

-- Clean up the test record after a short delay (this will be handled by the application)
-- The record will be deleted by the next cleanup operation