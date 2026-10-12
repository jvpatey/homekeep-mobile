-- AI usage log for the homekeep-ai edge function. One row per model call;
-- quota checks count successful rows per user and feature.

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  feature text NOT NULL CHECK (
    feature IN ('scan_nameplate', 'assistant_chat', 'extract_inspection')
  ),
  model text,
  input_tokens integer,
  output_tokens integer,
  status text NOT NULL CHECK (status IN ('ok', 'error', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ai_usage IS
  'One row per homekeep-ai call. Only status = ok counts against quotas.';

CREATE INDEX IF NOT EXISTS ai_usage_user_feature_created_idx
  ON public.ai_usage (user_id, feature, created_at);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_usage_select_own ON public.ai_usage;
CREATE POLICY ai_usage_select_own ON public.ai_usage
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- No insert/update/delete policies: only the service role writes.

-- ---------------------------------------------------------------------------
-- ai_quota_status: entitlement + usage counts in one round trip
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ai_quota_status(
  p_user_id uuid,
  p_feature text
)
RETURNS TABLE (is_plus boolean, used_total integer, used_today integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.user_has_plus(p_user_id),
    (
      SELECT count(*)::integer FROM public.ai_usage u
      WHERE u.user_id = p_user_id AND u.feature = p_feature AND u.status = 'ok'
    ),
    (
      SELECT count(*)::integer FROM public.ai_usage u
      WHERE u.user_id = p_user_id AND u.feature = p_feature AND u.status = 'ok'
        AND u.created_at > now() - interval '24 hours'
    );
$$;

REVOKE ALL ON FUNCTION public.ai_quota_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_quota_status(uuid, text) TO service_role;
