-- ICS calendar subscription tokens for the calendar-feed edge function.
-- One live token per user. The feed resolves the user's household at request
-- time, so joining or leaving a household changes what the feed shows without
-- a new link.

CREATE TABLE IF NOT EXISTS public.calendar_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

COMMENT ON TABLE public.calendar_feeds IS
  'Secret tokens for webcal subscriptions. Rows with revoked_at set no longer resolve.';

CREATE UNIQUE INDEX IF NOT EXISTS calendar_feeds_one_live_per_user_idx
  ON public.calendar_feeds (user_id)
  WHERE revoked_at IS NULL;

ALTER TABLE public.calendar_feeds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_feeds_select_own ON public.calendar_feeds;
CREATE POLICY calendar_feeds_select_own ON public.calendar_feeds
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- No insert/update/delete policies: writes go through the RPCs below.

-- 64 hex chars from two v4 UUIDs (~244 random bits); avoids a pgcrypto dependency.
CREATE OR REPLACE FUNCTION public.new_calendar_feed_token()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
$$;

REVOKE ALL ON FUNCTION public.new_calendar_feed_token() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.get_or_create_calendar_feed()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  live text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT token INTO live
  FROM calendar_feeds
  WHERE user_id = auth.uid() AND revoked_at IS NULL;

  IF live IS NOT NULL THEN
    RETURN live;
  END IF;

  INSERT INTO calendar_feeds (user_id, token)
  VALUES (auth.uid(), new_calendar_feed_token())
  ON CONFLICT (user_id) WHERE revoked_at IS NULL DO NOTHING
  RETURNING token INTO live;

  IF live IS NULL THEN
    SELECT token INTO live
    FROM calendar_feeds
    WHERE user_id = auth.uid() AND revoked_at IS NULL;
  END IF;

  RETURN live;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_calendar_feed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_calendar_feed() TO authenticated;

CREATE OR REPLACE FUNCTION public.rotate_calendar_feed()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fresh text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE calendar_feeds
  SET revoked_at = now()
  WHERE user_id = auth.uid() AND revoked_at IS NULL;

  INSERT INTO calendar_feeds (user_id, token)
  VALUES (auth.uid(), new_calendar_feed_token())
  RETURNING token INTO fresh;

  RETURN fresh;
END;
$$;

REVOKE ALL ON FUNCTION public.rotate_calendar_feed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rotate_calendar_feed() TO authenticated;
