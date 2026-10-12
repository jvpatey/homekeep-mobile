-- Home record: trusted pros (household-scoped), who did a hired job, and
-- one-off repairs logged after the fact.

-- ---------------------------------------------------------------------------
-- home_contacts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.home_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  company text,
  trade text,
  phone text,
  email text,
  website text,
  notes text,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.home_contacts IS
  'Pros and trades the household trusts (plumber, electrician, ...).';

CREATE INDEX IF NOT EXISTS home_contacts_household_id_idx
  ON public.home_contacts (household_id);
CREATE INDEX IF NOT EXISTS home_contacts_user_id_idx
  ON public.home_contacts (user_id);

-- Stamp the viewer's household on insert so members share one list.
CREATE OR REPLACE FUNCTION public.stamp_home_contact_household()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.household_id IS NULL THEN
    NEW.household_id := public.current_user_household_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stamp_home_contact_household ON public.home_contacts;
CREATE TRIGGER stamp_home_contact_household
  BEFORE INSERT ON public.home_contacts
  FOR EACH ROW EXECUTE FUNCTION public.stamp_home_contact_household();

DROP TRIGGER IF EXISTS update_home_contacts_updated_at ON public.home_contacts;
CREATE TRIGGER update_home_contacts_updated_at
  BEFORE UPDATE ON public.home_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.home_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS home_contacts_select_household ON public.home_contacts;
CREATE POLICY home_contacts_select_household ON public.home_contacts
  FOR SELECT USING (
    CASE
      WHEN public.current_user_household_id() IS NOT NULL THEN
        household_id = public.current_user_household_id()
      ELSE user_id = auth.uid()
    END
  );

DROP POLICY IF EXISTS home_contacts_insert_own ON public.home_contacts;
CREATE POLICY home_contacts_insert_own ON public.home_contacts
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (
      household_id IS NULL
      OR household_id = public.current_user_household_id()
    )
  );

DROP POLICY IF EXISTS home_contacts_update_household ON public.home_contacts;
CREATE POLICY home_contacts_update_household ON public.home_contacts
  FOR UPDATE USING (
    user_id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND household_id = public.current_user_household_id()
    )
  );

DROP POLICY IF EXISTS home_contacts_delete_household ON public.home_contacts;
CREATE POLICY home_contacts_delete_household ON public.home_contacts
  FOR DELETE USING (
    user_id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND household_id = public.current_user_household_id()
      AND EXISTS (
        SELECT 1 FROM public.household_members m
        WHERE m.household_id = home_contacts.household_id
          AND m.user_id = auth.uid()
          AND m.role = 'owner'
      )
    )
  );

-- ---------------------------------------------------------------------------
-- routine_instances.contact_id: who did a hired job
-- ---------------------------------------------------------------------------

ALTER TABLE public.routine_instances
  ADD COLUMN IF NOT EXISTS contact_id uuid
  REFERENCES public.home_contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS routine_instances_contact_id_idx
  ON public.routine_instances (contact_id)
  WHERE contact_id IS NOT NULL;

COMMENT ON COLUMN public.routine_instances.contact_id IS
  'Pro who did the work when labor_type = hired.';

-- ---------------------------------------------------------------------------
-- log_repair: one-off repair, recorded as already done
-- ---------------------------------------------------------------------------
-- Inserts an inactive interval-0 routine tagged source_plan_id = 'repair'.
-- create_initial_instance (AFTER INSERT) opens one instance; we complete it
-- in place. create_next_instance skips inactive / interval-0 routines, so no
-- follow-up occurrence is created.

CREATE OR REPLACE FUNCTION public.log_repair(
  p_title text,
  p_category text,
  p_completed_on timestamptz,
  p_description text DEFAULT NULL,
  p_equipment_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_cost_amount numeric DEFAULT NULL,
  p_labor_type text DEFAULT NULL,
  p_contact_id uuid DEFAULT NULL,
  p_photo_storage_path text DEFAULT NULL
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
  v_when timestamptz := COALESCE(p_completed_on, now());
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  IF p_title IS NULL OR length(btrim(p_title)) = 0 THEN
    RAISE EXCEPTION 'A repair needs a title' USING ERRCODE = '22023';
  END IF;
  IF p_labor_type IS NOT NULL AND p_labor_type NOT IN ('diy', 'hired') THEN
    RAISE EXCEPTION 'Invalid labor type' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.maintenance_routines (
    user_id, household_id, title, description, category, priority,
    estimated_duration_minutes, interval_days, start_date, is_active,
    source_plan_id, equipment_id
  ) VALUES (
    v_user, public.current_user_household_id(), btrim(p_title),
    NULLIF(btrim(COALESCE(p_description, '')), ''), p_category, 'medium',
    0, 0, v_when, false, 'repair', p_equipment_id
  )
  RETURNING id INTO v_routine_id;

  SELECT id INTO v_instance_id
  FROM public.routine_instances
  WHERE routine_id = v_routine_id
  ORDER BY created_at
  LIMIT 1;

  IF v_instance_id IS NULL THEN
    INSERT INTO public.routine_instances (routine_id, due_date)
    VALUES (v_routine_id, v_when)
    RETURNING id INTO v_instance_id;
  END IF;

  -- Defensive: a repair has exactly one (completed) occurrence.
  DELETE FROM public.routine_instances
  WHERE routine_id = v_routine_id AND id <> v_instance_id;

  UPDATE public.routine_instances SET
    due_date = v_when,
    completed_at = v_when,
    is_completed = true,
    notes = NULLIF(btrim(COALESCE(p_notes, '')), ''),
    cost_amount = p_cost_amount,
    labor_type = p_labor_type,
    contact_id = CASE WHEN p_labor_type = 'hired' THEN p_contact_id END,
    photo_storage_path = p_photo_storage_path
  WHERE id = v_instance_id;

  IF p_contact_id IS NOT NULL AND p_labor_type = 'hired' THEN
    UPDATE public.home_contacts
    SET last_used_at = now()
    WHERE id = p_contact_id;
  END IF;

  RETURN v_instance_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_repair(
  text, text, timestamptz, text, uuid, text, numeric, text, uuid, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_repair(
  text, text, timestamptz, text, uuid, text, numeric, text, uuid, text
) TO authenticated;
