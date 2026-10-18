-- First-run home setup seeding is free: skip the free-action gate on
-- maintenance_routines INSERT while the user's home_setup_set_at is still null.
-- Completes and other writes keep using require_plus_or_consume_free_action.

CREATE OR REPLACE FUNCTION public.trg_routines_require_plus_or_free()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  setup_at timestamptz;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT home_setup_set_at INTO setup_at
  FROM public.profiles
  WHERE id = uid;

  -- First-run setup seed (schedule + equipment hints before mark done).
  IF setup_at IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.require_plus_or_consume_free_action(5);
  RETURN NEW;
END;
$$;
