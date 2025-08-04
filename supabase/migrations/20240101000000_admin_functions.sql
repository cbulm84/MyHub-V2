-- IMPORTANT: Only use in development!
-- This function allows executing arbitrary SQL

CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Only allow in development (you should add additional checks)
  IF current_setting('app.environment', true) = 'production' THEN
    RAISE EXCEPTION 'exec_sql is not allowed in production';
  END IF;

  -- Execute the query and return results as JSON
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
  
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Query error: %', SQLERRM;
END;
$$;

-- Grant execute permission to service role only
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;