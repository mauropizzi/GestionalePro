-- This function allows executing arbitrary SQL for diagnostics and schema management.
-- It is restricted to the service_role.

CREATE OR REPLACE FUNCTION public.sql(query text)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE 'SELECT to_jsonb(t) FROM (' || query || ') t';
EXCEPTION WHEN OTHERS THEN
  -- Handle commands that don't return rows (like COMMENT)
  EXECUTE query;
  RETURN NEXT jsonb_build_object('status', 'success');
END;
$$;

-- Revoke all permissions from public
REVOKE ALL ON FUNCTION public.sql(text) FROM public;

-- Grant execution only to service_role
GRANT EXECUTE ON FUNCTION public.sql(text) TO service_role;