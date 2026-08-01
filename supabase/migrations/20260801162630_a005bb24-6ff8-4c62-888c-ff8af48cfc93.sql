
DO $$
DECLARE
  r record;
  cmd_txt text;
  sql_txt text;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, permissive, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname IN ('public','storage')
      AND roles::text = '{public}'
      AND (COALESCE(qual,'') || COALESCE(with_check,'')) ~ '(is_admin|has_role)'
  LOOP
    cmd_txt := r.cmd;
    IF cmd_txt = 'ALL' THEN cmd_txt := 'ALL'; END IF;
    sql_txt := format('DROP POLICY %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
    EXECUTE sql_txt;
    sql_txt := format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO authenticated',
      r.policyname, r.schemaname, r.tablename,
      CASE WHEN r.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      cmd_txt);
    IF r.qual IS NOT NULL THEN
      sql_txt := sql_txt || format(' USING (%s)', r.qual);
    END IF;
    IF r.with_check IS NOT NULL THEN
      sql_txt := sql_txt || format(' WITH CHECK (%s)', r.with_check);
    END IF;
    EXECUTE sql_txt;
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
