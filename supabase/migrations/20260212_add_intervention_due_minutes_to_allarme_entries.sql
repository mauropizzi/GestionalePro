-- Aggiunge una colonna per memorizzare i minuti entro i quali effettuare l'intervento
ALTER TABLE public.allarme_entries
ADD COLUMN IF NOT EXISTS intervention_due_minutes INTEGER NULL;

-- Facoltativo: commento descrittivo
COMMENT ON COLUMN public.allarme_entries.intervention_due_minutes IS 'Minuti entro i quali effettuare l''intervento (derivato dall''UI).';