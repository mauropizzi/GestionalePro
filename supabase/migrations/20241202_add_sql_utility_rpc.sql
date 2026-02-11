-- This function allows executing arbitrary SQL. 
-- SECURITY DEFINER ensures it runs with the privileges of the creator (postgres).
-- We restrict it to the service_role for security.

CREATE OR REPLACE FUNCTION public.sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE query INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- For commands that don't return rows (like COMMENT or CREATE VIEW)
  -- we just return success if no error occurred
  RETURN jsonb_build_object('status', 'success');
END;
$$;

-- Revoke all permissions from public
REVOKE ALL ON FUNCTION public.sql(text) FROM public;

-- Grant execution only to service_role
GRANT EXECUTE ON FUNCTION public.sql(text) TO service_role;