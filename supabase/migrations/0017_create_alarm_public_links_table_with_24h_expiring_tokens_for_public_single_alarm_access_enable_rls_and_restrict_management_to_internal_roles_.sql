CREATE TABLE IF NOT EXISTS public.alarm_public_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alarm_id UUID NOT NULL REFERENCES public.allarme_entries(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.alarm_public_links ENABLE ROW LEVEL SECURITY;

-- Allow only authorized internal roles to manage links (not used by the public page; edge function uses service role)
DROP POLICY IF EXISTS "alarm_public_links_select" ON public.alarm_public_links;
CREATE POLICY "alarm_public_links_select" ON public.alarm_public_links
FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'amministrazione'::text, 'responsabile_operativo'::text, 'operativo'::text]));

DROP POLICY IF EXISTS "alarm_public_links_insert" ON public.alarm_public_links;
CREATE POLICY "alarm_public_links_insert" ON public.alarm_public_links
FOR INSERT TO authenticated
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'amministrazione'::text, 'responsabile_operativo'::text, 'operativo'::text]));

DROP POLICY IF EXISTS "alarm_public_links_delete" ON public.alarm_public_links;
CREATE POLICY "alarm_public_links_delete" ON public.alarm_public_links
FOR DELETE TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'amministrazione'::text, 'responsabile_operativo'::text, 'operativo'::text]));
