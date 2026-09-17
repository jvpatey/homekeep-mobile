-- Free first-win pool: unpaid users may complete/create up to N times before Plus.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_actions_used integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.free_actions_used IS
  'Count of free complete/create actions used while not on HomeKeep +.';

-- Atomically consume one free action. Returns true if consumed, false if at cap.
CREATE OR REPLACE FUNCTION public.consume_free_action(p_limit integer DEFAULT 5)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  updated integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'Invalid limit: %', p_limit;
  END IF;

  UPDATE public.profiles
  SET free_actions_used = free_actions_used + 1
  WHERE id = uid
    AND free_actions_used < p_limit;

  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_free_action(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_free_action(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_free_action(integer) TO service_role;
