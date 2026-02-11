-- Add columns for geolocation and full timestamps to allarme_entries
ALTER TABLE public.allarme_entries 
ADD COLUMN IF NOT EXISTS intervention_start_lat NUMERIC,
ADD COLUMN IF NOT EXISTS intervention_start_long NUMERIC,
ADD COLUMN IF NOT EXISTS intervention_start_full_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS intervention_end_lat NUMERIC,
ADD COLUMN IF NOT EXISTS intervention_end_long NUMERIC,
ADD COLUMN IF NOT EXISTS intervention_end_full_timestamp TIMESTAMP WITH TIME ZONE;

-- Add policies if needed, though they usually inherit from table RLS