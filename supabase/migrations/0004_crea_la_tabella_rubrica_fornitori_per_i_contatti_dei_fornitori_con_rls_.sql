-- Crea la tabella rubrica_fornitori
CREATE TABLE public.rubrica_fornitori (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fornitore_id UUID NOT NULL REFERENCES public.fornitori(id) ON DELETE CASCADE,
  tipo_recapito TEXT NOT NULL,
  nome_persona TEXT,
  telefono_fisso TEXT,
  telefono_cellulare TEXT,
  email_recapito TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilita RLS (REQUIRED per sicurezza)
ALTER TABLE public.rubrica_fornitori ENABLE ROW LEVEL SECURITY;

-- Policy per SELECT: tutti gli utenti autenticati possono vedere i contatti dei fornitori a cui hanno accesso
CREATE POLICY "Authenticated users can view rubrica_fornitori" ON public.rubrica_fornitori
FOR SELECT TO authenticated USING (
  (EXISTS ( SELECT 1 FROM public.fornitori WHERE (fornitori.id = rubrica_fornitori.fornitore_id)))
  OR (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'amministrazione'::text, 'responsabile_operativo'::text, 'operativo'::text]))
);

-- Policy per INSERT: gli amministratori e i responsabili operativi possono inserire contatti
CREATE POLICY "Admins and operational managers can insert rubrica_fornitori" ON public.rubrica_fornitori
FOR INSERT TO authenticated WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'amministrazione'::text, 'responsabile_operativo'::text]));

-- Policy per UPDATE: gli amministratori e i responsabili operativi possono aggiornare i contatti
CREATE POLICY "Admins and operational managers can update rubrica_fornitori" ON public.rubrica_fornitori
FOR UPDATE TO authenticated USING (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'amministrazione'::text, 'responsabile_operativo'::text])) WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'amministrazione'::text, 'responsabile_operativo'::text]));

-- Policy per DELETE: solo gli amministratori possono eliminare i contatti
CREATE POLICY "Admins can delete rubrica_fornitori" ON public.rubrica_fornitori
FOR DELETE TO authenticated USING (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'amministrazione'::text]));