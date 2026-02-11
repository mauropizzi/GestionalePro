-- Returns public table columns metadata (used by schema-info edge function)
-- Kept restricted: only service_role can execute.

CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public, information_schema
AS $$
  SELECT
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = get_table_columns.table_name
  ORDER BY c.ordinal_position;
$$;

REVOKE ALL ON FUNCTION public.get_table_columns(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_table_columns(text) TO service_role;
