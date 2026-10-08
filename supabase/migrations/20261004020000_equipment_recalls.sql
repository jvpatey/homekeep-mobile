-- CPSC recall alerts. The recall-scan edge function (service role) matches
-- equipment manufacturer + model against saferproducts.gov and writes rows
-- here; notification-worker pushes them at 08:00 local. Members can read
-- their home's recalls and dismiss them, nothing else.

-- ---------------------------------------------------------------------------
-- equipment_recalls
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.equipment_recalls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipment_manuals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  -- Reserved for multi-home; always null today.
  home_id uuid,
  recall_number text NOT NULL,
  title text NOT NULL,
  url text,
  hazard text,
  remedy text,
  recall_date date,
  -- 'model' when a model number token matched, 'name' for a product-name match.
  matched_on text NOT NULL DEFAULT 'model' CHECK (matched_on IN ('model', 'name')),
  notified_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT equipment_recalls_equipment_recall_key UNIQUE (equipment_id, recall_number)
);

COMMENT ON TABLE public.equipment_recalls IS
  'CPSC recalls matched to equipment by manufacturer and model number.';

CREATE INDEX IF NOT EXISTS equipment_recalls_household_id_idx
  ON public.equipment_recalls (household_id);
CREATE INDEX IF NOT EXISTS equipment_recalls_user_id_idx
  ON public.equipment_recalls (user_id);
CREATE INDEX IF NOT EXISTS equipment_recalls_open_idx
  ON public.equipment_recalls (created_at)
  WHERE dismissed_at IS NULL;

DROP TRIGGER IF EXISTS update_equipment_recalls_updated_at ON public.equipment_recalls;
CREATE TRIGGER update_equipment_recalls_updated_at
  BEFORE UPDATE ON public.equipment_recalls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.equipment_recalls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS equipment_recalls_select_household ON public.equipment_recalls;
CREATE POLICY equipment_recalls_select_household ON public.equipment_recalls
  FOR SELECT USING (
    CASE
      WHEN public.current_user_household_id() IS NOT NULL THEN
        household_id = public.current_user_household_id()
      ELSE user_id = auth.uid()
    END
  );

DROP POLICY IF EXISTS equipment_recalls_update_household ON public.equipment_recalls;
CREATE POLICY equipment_recalls_update_household ON public.equipment_recalls
  FOR UPDATE USING (
    user_id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND household_id = public.current_user_household_id()
    )
  );

-- Inserts come from the service role only; members may only set dismissed_at.
REVOKE INSERT, UPDATE, DELETE ON public.equipment_recalls FROM anon, authenticated;
GRANT SELECT ON public.equipment_recalls TO authenticated;
GRANT UPDATE (dismissed_at) ON public.equipment_recalls TO authenticated;

-- ---------------------------------------------------------------------------
-- recall_scan_state: single row tracking the last CPSC scan.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.recall_scan_state (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  -- When the last complete pass over every manufacturer started.
  last_run_at timestamptz,
  last_full_run_at timestamptz,
  -- A pass capped by the per-run request limit resumes after this
  -- normalized manufacturer key.
  cursor text,
  pass_started_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.recall_scan_state IS
  'One row. recall-scan uses last_run_at as LastPublishDateStart after the first full pass.';

INSERT INTO public.recall_scan_state (id) VALUES (true)
ON CONFLICT (id) DO NOTHING;

-- No policies: service role only.
ALTER TABLE public.recall_scan_state ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Preference: recall alerts are on by default and not gated on HomeKeep+.
-- ---------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.notification_preferences
  ADD COLUMN IF NOT EXISTS recall_alerts boolean NOT NULL DEFAULT true;
