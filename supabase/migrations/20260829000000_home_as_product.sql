-- Home as the product: setup flag, equipment-linked routines, rich completions,
-- emergency facts, and household sharing.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS home_setup_set_at timestamptz,
  ADD COLUMN IF NOT EXISTS home_emergency jsonb,
  ADD COLUMN IF NOT EXISTS household_id uuid;

ALTER TABLE maintenance_routines
  ADD COLUMN IF NOT EXISTS equipment_id uuid;

ALTER TABLE routine_instances
  ADD COLUMN IF NOT EXISTS cost_amount numeric,
  ADD COLUMN IF NOT EXISTS labor_type text,
  ADD COLUMN IF NOT EXISTS photo_storage_path text;

CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  invite_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS household_members (
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, user_id)
);

CREATE INDEX IF NOT EXISTS household_members_user_id_idx
  ON household_members (user_id);

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS households_member_select ON households;
CREATE POLICY households_member_select ON households
  FOR SELECT USING (
    created_by = auth.uid()
    OR id = (SELECT p.household_id FROM profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS households_owner_insert ON households;
CREATE POLICY households_owner_insert ON households
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS households_owner_update ON households;
CREATE POLICY households_owner_update ON households
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS households_owner_delete ON households;
CREATE POLICY households_owner_delete ON households
  FOR DELETE USING (created_by = auth.uid());

DROP POLICY IF EXISTS household_members_select ON household_members;
CREATE POLICY household_members_select ON household_members
  FOR SELECT USING (
    household_id = (
      SELECT p.household_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS household_members_insert ON household_members;
CREATE POLICY household_members_insert ON household_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS household_members_delete ON household_members;
CREATE POLICY household_members_delete ON household_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_members.household_id AND h.created_by = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION join_household(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hid uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO hid
  FROM households
  WHERE invite_code = upper(trim(p_code));

  IF hid IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  INSERT INTO household_members (household_id, user_id, role)
  VALUES (hid, auth.uid(), 'member')
  ON CONFLICT (household_id, user_id) DO NOTHING;

  UPDATE profiles
  SET household_id = hid, updated_at = now()
  WHERE id = auth.uid();

  RETURN hid;
END;
$$;

REVOKE ALL ON FUNCTION join_household(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION join_household(text) TO authenticated;
