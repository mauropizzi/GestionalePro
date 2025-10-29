-- Crea la tabella rubrica_punti_servizio
CREATE TABLE public.rubrica_punti_servizio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  punto_servizio_id UUID NOT NULL REFERENCES public.punti_servizio(id) ON DELETE CASCADE,
  nome_contatto TEXT NOT NULL,
  ruolo_contatto TEXT,
  telefono TEXT,
  email TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilita RLS (REQUIRED per sicurezza)
ALTER TABLE public.rubrica_punti_servizio ENABLE ROW LEVEL SECURITY;

-- Policy per SELECT: tutti gli utenti autenticati possono vedere i contatti
CREATE POLICY "Authenticated users can view rubrica_punti_servizio" ON public.rubrica_punti_servizio
FOR SELECT TO authenticated USING (true);

-- Policy per INSERT: tutti gli utenti autenticati possono inserire contatti
CREATE POLICY "Authenticated users can insert rubrica_punti_servizio" ON public.rubrica_punti_servizio
FOR INSERT TO authenticated WITH CHECK (true);

-- Policy per UPDATE: gli amministratori e i responsabili operativi possono aggiornare i contatti
CREATE POLICY "Admins and operational managers can update rubrica_punti_servizio" ON public.rubrica_punti_servizio
FOR UPDATE TO authenticated USING (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'amministrazione'::text, 'responsabile_operativo'::text])) WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'amministrazione'::text, 'responsabile_operativo'::text]));

-- Policy per DELETE: solo gli amministratori possono eliminare i contatti
CREATE POLICY "Admins can delete rubrica_punti_servizio" ON public.rubrica_punti_servizio
FOR DELETE TO authenticated USING (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'amministrazione'::text]));