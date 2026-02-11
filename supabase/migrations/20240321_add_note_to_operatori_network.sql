-- Add note column to operatori_network table
ALTER TABLE public.operatori_network 
ADD COLUMN IF NOT EXISTS note TEXT;