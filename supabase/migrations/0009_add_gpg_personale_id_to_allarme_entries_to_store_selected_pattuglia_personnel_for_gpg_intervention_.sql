ALTER TABLE public.allarme_entries
ADD COLUMN IF NOT EXISTS gpg_personale_id UUID NULL REFERENCES public.personale(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.allarme_entries.gpg_personale_id IS $$ID del personale (ruolo: Pattuglia) che ha effettuato l'intervento GPG.$$;