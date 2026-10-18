-- Server-side HomeKeep + gates:
-- 1) Free complete/create consume one free action (once per statement/txn)
-- 2) Documents insert requires Plus (household-aware via user_has_plus)
-- 3) Document storage uploads under .../documents/... require Plus

-- ---------------------------------------------------------------------------
-- Free-action gate for schedule writes
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.require_plus_or_consume_free_action(
  p_limit integer DEFAULT 5
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF public.user_has_plus(uid) THEN
    RETURN;
  END IF;

  -- Already consumed once in this transaction (multi-row insert / log_repair).
  IF current_setting('homekeep.fa_consumed', true) = '1' THEN
    RETURN;
  END IF;

  IF NOT public.consume_free_action(p_limit) THEN
    RAISE EXCEPTION 'plus_required'
      USING ERRCODE = 'P0001',
            HINT = 'Subscribe to HomeKeep + or use a remaining free action.';
  END IF;

  PERFORM set_config('homekeep.fa_consumed', '1', true);
END;
$$;

REVOKE ALL ON FUNCTION public.require_plus_or_consume_free_action(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.require_plus_or_consume_free_action(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.require_plus_or_consume_free_action(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.trg_routines_require_plus_or_free()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.require_plus_or_consume_free_action(5);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS maintenance_routines_plus_or_free ON public.maintenance_routines;
CREATE TRIGGER maintenance_routines_plus_or_free
  BEFORE INSERT ON public.maintenance_routines
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_routines_require_plus_or_free();

CREATE OR REPLACE FUNCTION public.trg_instances_complete_require_plus_or_free()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_completed IS TRUE
     AND OLD.is_completed IS DISTINCT FROM TRUE THEN
    PERFORM public.require_plus_or_consume_free_action(5);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS routine_instances_complete_plus_or_free ON public.routine_instances;
CREATE TRIGGER routine_instances_complete_plus_or_free
  BEFORE UPDATE ON public.routine_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_instances_complete_require_plus_or_free();

-- ---------------------------------------------------------------------------
-- Documents require Plus to create / upload
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS documents_insert_own ON public.documents;
CREATE POLICY documents_insert_own ON public.documents
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND public.user_has_plus(auth.uid())
    AND (
      household_id IS NULL
      OR household_id = public.current_user_household_id()
    )
  );

-- Storage: allow non-document paths (manuals, receipts, photos); gate documents/.
DROP POLICY IF EXISTS equipment_manuals_insert_own ON storage.objects;
CREATE POLICY equipment_manuals_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'equipment-manuals'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
      (storage.foldername(name))[2] IS DISTINCT FROM 'documents'
      OR public.user_has_plus(auth.uid())
    )
  );

DROP POLICY IF EXISTS equipment_manuals_update_own ON storage.objects;
CREATE POLICY equipment_manuals_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'equipment-manuals'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'equipment-manuals'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
      (storage.foldername(name))[2] IS DISTINCT FROM 'documents'
      OR public.user_has_plus(auth.uid())
    )
  );
