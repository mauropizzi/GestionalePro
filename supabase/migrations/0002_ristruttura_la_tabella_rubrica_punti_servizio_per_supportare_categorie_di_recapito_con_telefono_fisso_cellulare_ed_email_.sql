-- ATTENZIONE: Questa operazione è distruttiva e cancellerà tutti i dati esistenti nella tabella rubrica_punti_servizio.
-- Si consiglia vivamente di eseguire un backup prima di procedere.

-- Rimuovi le colonne esistenti relative ai contatti
ALTER TABLE public.rubrica_punti_servizio
DROP COLUMN IF EXISTS nome_contatto,
DROP COLUMN IF EXISTS ruolo_contatto,
DROP COLUMN IF EXISTS telefono,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS numero_sul_posto,
DROP COLUMN IF EXISTS reperibile_1,
DROP COLUMN IF EXISTS reperibile_2,
DROP COLUMN IF EXISTS reperibile_3,
DROP COLUMN IF EXISTS responsabile_contatto;

-- Aggiungi le nuove colonne per la struttura desiderata
ALTER TABLE public.rubrica_punti_servizio
ADD COLUMN tipo_recapito TEXT NOT NULL,
ADD COLUMN nome_persona TEXT,
ADD COLUMN telefono_fisso TEXT,
ADD COLUMN telefono_cellulare TEXT,
ADD COLUMN email_recapito TEXT;

-- Aggiorna le policy RLS per riflettere la nuova struttura (se necessario, altrimenti rimangono le stesse)
-- Le policy esistenti dovrebbero essere ancora valide se basate su auth.uid() e punto_servizio_id
-- Se le policy facevano riferimento a colonne specifiche ora rimosse, dovranno essere ricreate.
-- Per semplicità, riaffermo le policy generiche che erano già presenti.
DROP POLICY IF EXISTS "Authenticated users can view rubrica_punti_servizio" ON public.rubrica_punti_servizio;
DROP POLICY IF EXISTS "Authenticated users can insert rubrica_punti_servizio" ON public.rubrica_punti_servizio;
DROP POLICY IF EXISTS "Admins and operational managers can update rubrica_punti_servizio" ON public.rubrica_punti_servizio;
DROP POLICY IF EXISTS "Admins can delete rubrica_punti_servizio" ON public.rubrica_punti_servizio;

CREATE POLICY "Authenticated users can view rubrica_punti_servizio" ON public.rubrica_punti_servizio
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert rubrica_punti_servizio" ON public.rubrica_punti_servizio
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins and operational managers can update rubrica_punti_servizio" ON public.rubrica_punti_servizio
FOR UPDATE TO authenticated USING (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'amministrazione'::text, 'responsabile_operativo'::text])) WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'amministrazione'::text, 'responsabile_operativo'::text]));

CREATE POLICY "Admins can delete rubrica_punti_servizio" ON public.rubrica_punti_servizio
FOR DELETE TO authenticated USING (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'amministrazione'::text]));