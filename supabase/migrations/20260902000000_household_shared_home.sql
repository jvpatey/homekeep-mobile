-- One household = one home. Routines and equipment become visible to members.
-- When a user has household_id set, they see household-stamped rows only
-- (owner rows are backfilled). Personal leftover rows stay hidden until they leave.

ALTER TABLE maintenance_routines
  ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES households(id) ON DELETE SET NULL;

ALTER TABLE equipment_manuals
  ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES households(id) ON DELETE SET NULL;

UPDATE maintenance_routines r
SET household_id = p.household_id
FROM profiles p
WHERE r.user_id = p.id
  AND p.household_id IS NOT NULL
  AND r.household_id IS NULL;

UPDATE equipment_manuals e
SET household_id = p.household_id
FROM profiles p
WHERE e.user_id = p.id
  AND p.household_id IS NOT NULL
  AND e.household_id IS NULL;

CREATE INDEX IF NOT EXISTS maintenance_routines_household_id_idx
  ON maintenance_routines (household_id);

CREATE INDEX IF NOT EXISTS equipment_manuals_household_id_idx
  ON equipment_manuals (household_id);

-- Read household_id without re-entering profiles RLS (avoids 42P17 recursion).
CREATE OR REPLACE FUNCTION public.current_user_household_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.profiles WHERE id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_user_household_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_household_id() TO authenticated;

-- Members can read other profiles in the same household (owner home fields).
DROP POLICY IF EXISTS profiles_household_select ON profiles;
CREATE POLICY profiles_household_select ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND household_id = public.current_user_household_id()
    )
  );

DROP POLICY IF EXISTS routines_select_household ON maintenance_routines;
CREATE POLICY routines_select_household ON maintenance_routines
  FOR SELECT USING (
    CASE
      WHEN public.current_user_household_id() IS NOT NULL THEN
        household_id = public.current_user_household_id()
      ELSE user_id = auth.uid()
    END
  );

DROP POLICY IF EXISTS routines_insert_own ON maintenance_routines;
CREATE POLICY routines_insert_own ON maintenance_routines
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS routines_update_household ON maintenance_routines;
CREATE POLICY routines_update_household ON maintenance_routines
  FOR UPDATE USING (
    user_id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND household_id = public.current_user_household_id()
    )
  );

DROP POLICY IF EXISTS routines_delete_owner ON maintenance_routines;
CREATE POLICY routines_delete_owner ON maintenance_routines
  FOR DELETE USING (
    user_id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND household_id = public.current_user_household_id()
      AND EXISTS (
        SELECT 1 FROM household_members m
        WHERE m.household_id = maintenance_routines.household_id
          AND m.user_id = auth.uid()
          AND m.role = 'owner'
      )
    )
  );

DROP POLICY IF EXISTS instances_select_household ON routine_instances;
CREATE POLICY instances_select_household ON routine_instances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM maintenance_routines r
      WHERE r.id = routine_instances.routine_id
        AND (
          CASE
            WHEN public.current_user_household_id() IS NOT NULL THEN
              r.household_id = public.current_user_household_id()
            ELSE r.user_id = auth.uid()
          END
        )
    )
  );

DROP POLICY IF EXISTS instances_write_household ON routine_instances;
CREATE POLICY instances_write_household ON routine_instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM maintenance_routines r
      WHERE r.id = routine_instances.routine_id
        AND (
          CASE
            WHEN public.current_user_household_id() IS NOT NULL THEN
              r.household_id = public.current_user_household_id()
            ELSE r.user_id = auth.uid()
          END
        )
    )
  );

DROP POLICY IF EXISTS equipment_select_household ON equipment_manuals;
CREATE POLICY equipment_select_household ON equipment_manuals
  FOR SELECT USING (
    CASE
      WHEN public.current_user_household_id() IS NOT NULL THEN
        household_id = public.current_user_household_id()
      ELSE user_id = auth.uid()
    END
  );

DROP POLICY IF EXISTS equipment_insert_own ON equipment_manuals;
CREATE POLICY equipment_insert_own ON equipment_manuals
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS equipment_update_household ON equipment_manuals;
CREATE POLICY equipment_update_household ON equipment_manuals
  FOR UPDATE USING (
    user_id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND household_id = public.current_user_household_id()
    )
  );

DROP POLICY IF EXISTS equipment_delete_household ON equipment_manuals;
CREATE POLICY equipment_delete_household ON equipment_manuals
  FOR DELETE USING (
    user_id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND household_id = public.current_user_household_id()
      AND EXISTS (
        SELECT 1 FROM household_members m
        WHERE m.household_id = equipment_manuals.household_id
          AND m.user_id = auth.uid()
          AND m.role = 'owner'
      )
    )
  );
