-- Policies that SELECT profiles from inside a profiles (or profiles-dependent)
-- policy recurse until Postgres raises 42P17. Read household_id through a
-- SECURITY DEFINER helper so RLS is not re-entered.

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

DROP POLICY IF EXISTS profiles_household_select ON profiles;
CREATE POLICY profiles_household_select ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND household_id = public.current_user_household_id()
    )
  );

DROP POLICY IF EXISTS households_member_select ON households;
CREATE POLICY households_member_select ON households
  FOR SELECT USING (
    created_by = auth.uid()
    OR id = public.current_user_household_id()
  );

DROP POLICY IF EXISTS household_members_select ON household_members;
CREATE POLICY household_members_select ON household_members
  FOR SELECT USING (
    household_id = public.current_user_household_id()
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
