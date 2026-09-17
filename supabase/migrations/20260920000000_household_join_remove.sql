-- Harden join (leave prior household) + owner remove member RPC.

CREATE OR REPLACE FUNCTION join_household(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hid uuid;
  prior_hid uuid;
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

  SELECT household_id INTO prior_hid
  FROM profiles
  WHERE id = auth.uid();

  IF prior_hid IS NOT NULL AND prior_hid = hid THEN
    RETURN hid;
  END IF;

  -- Leave any prior memberships before joining the new household.
  DELETE FROM household_members
  WHERE user_id = auth.uid();

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

-- Owner removes a member and clears their profiles.household_id.
CREATE OR REPLACE FUNCTION remove_household_member(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hid uuid;
  member_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_id IS NULL OR p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;

  SELECT household_id INTO hid
  FROM profiles
  WHERE id = auth.uid();

  IF hid IS NULL THEN
    RAISE EXCEPTION 'Not in a household';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM households h
    WHERE h.id = hid AND h.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the household owner can remove members';
  END IF;

  SELECT role INTO member_role
  FROM household_members
  WHERE household_id = hid AND user_id = p_user_id;

  IF member_role IS NULL THEN
    RAISE EXCEPTION 'User is not in this household';
  END IF;

  IF member_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot remove the household owner';
  END IF;

  DELETE FROM household_members
  WHERE household_id = hid AND user_id = p_user_id;

  UPDATE profiles
  SET household_id = NULL, updated_at = now()
  WHERE id = p_user_id AND household_id = hid;
END;
$$;

REVOKE ALL ON FUNCTION remove_household_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION remove_household_member(uuid) TO authenticated;
