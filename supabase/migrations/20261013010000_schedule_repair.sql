-- Pending one-off repairs: something that needs fixing, with a due date and
-- no recurrence. Same shape as log_repair (interval-0 routine tagged
-- source_plan_id = 'repair'), but active with one open instance, so it sits
-- on the schedule until it is done.
--
-- Repair routines are active while their instance is open and inactive once
-- it is completed, so done repairs drop off the reminder list and an undone
-- completion puts the repair back.

CREATE OR REPLACE FUNCTION public.schedule_repair(
  p_title text,
  p_category text,
  p_due_date timestamptz,
  p_description text DEFAULT NULL,
  p_equipment_id uuid DEFAULT NULL,
  p_priority text DEFAULT 'medium'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_routine_id uuid;
  v_instance_id uuid;
  v_due timestamptz := COALESCE(p_due_date, now());
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  IF p_title IS NULL OR length(btrim(p_title)) = 0 THEN
    RAISE EXCEPTION 'A repair needs a title' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(p_priority, 'medium') NOT IN ('low', 'medium', 'high', 'urgent') THEN
    RAISE EXCEPTION 'Invalid priority' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.maintenance_routines (
    user_id, household_id, title, description, category, priority,
    estimated_duration_minutes, interval_days, start_date, is_active,
    source_plan_id, equipment_id
  ) VALUES (
    v_user, public.current_user_household_id(), btrim(p_title),
    NULLIF(btrim(COALESCE(p_description, '')), ''), p_category,
    COALESCE(p_priority, 'medium'), 60, 0, v_due, true, 'repair', p_equipment_id
  )
  RETURNING id INTO v_routine_id;

  SELECT id INTO v_instance_id
  FROM public.routine_instances
  WHERE routine_id = v_routine_id
  ORDER BY created_at
  LIMIT 1;

  IF v_instance_id IS NULL THEN
    INSERT INTO public.routine_instances (routine_id, due_date)
    VALUES (v_routine_id, v_due)
    RETURNING id INTO v_instance_id;
  ELSE
    UPDATE public.routine_instances SET due_date = v_due WHERE id = v_instance_id;
  END IF;

  DELETE FROM public.routine_instances
  WHERE routine_id = v_routine_id AND id <> v_instance_id;

  RETURN v_routine_id;
END;
$$;

REVOKE ALL ON FUNCTION public.schedule_repair(
  text, text, timestamptz, text, uuid, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.schedule_repair(
  text, text, timestamptz, text, uuid, text
) TO authenticated;

-- ---------------------------------------------------------------------------
-- Keep repair routines' is_active in step with their single instance
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_repair_routine_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_completed IS DISTINCT FROM OLD.is_completed THEN
    UPDATE public.maintenance_routines
    SET is_active = NOT COALESCE(NEW.is_completed, false)
    WHERE id = NEW.routine_id
      AND source_plan_id = 'repair'
      AND interval_days = 0
      AND is_active IS DISTINCT FROM NOT COALESCE(NEW.is_completed, false);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_repair_routine_active ON public.routine_instances;
CREATE TRIGGER sync_repair_routine_active
  AFTER UPDATE OF is_completed ON public.routine_instances
  FOR EACH ROW EXECUTE FUNCTION public.sync_repair_routine_active();
