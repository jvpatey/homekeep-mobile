-- HomeKeep + entitlements. Purchaser row grants access to their current household.
-- Store/RC product ids stay homekeep_plus_*; display name is HomeKeep +.

CREATE TABLE IF NOT EXISTS public.entitlements (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  household_id uuid REFERENCES public.households (id) ON DELETE SET NULL,
  status text NOT NULL CHECK (
    status IN ('trialing', 'active', 'grace', 'expired', 'promo')
  ),
  store text CHECK (
    store IS NULL
    OR store IN ('app_store', 'play_store', 'promotional')
  ),
  product_id text,
  expires_at timestamptz,
  revenuecat_app_user_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS entitlements_household_id_idx
  ON public.entitlements (household_id);

CREATE INDEX IF NOT EXISTS entitlements_status_idx
  ON public.entitlements (status);

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entitlements_select_own_or_household ON public.entitlements;
CREATE POLICY entitlements_select_own_or_household ON public.entitlements
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND household_id = public.current_user_household_id()
    )
  );

CREATE OR REPLACE FUNCTION public.user_has_plus(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.entitlements e
    WHERE e.status IN ('trialing', 'active', 'grace', 'promo')
      AND (e.expires_at IS NULL OR e.expires_at > now())
      AND (
        e.user_id = p_user_id
        OR (
          e.household_id IS NOT NULL
          AND e.household_id = (
            SELECT household_id FROM public.profiles WHERE id = p_user_id
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_plus(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_plus(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_plus(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.current_user_has_plus()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_has_plus(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.current_user_has_plus() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_has_plus() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_plus() TO service_role;

CREATE OR REPLACE FUNCTION public.sync_entitlement_household()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.entitlements
  SET
    household_id = NEW.household_id,
    updated_at = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_entitlement_household ON public.profiles;
CREATE TRIGGER profiles_sync_entitlement_household
  AFTER UPDATE OF household_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_entitlement_household();

-- 90-day complimentary access for homes already set up (existing 1.3.x users).
INSERT INTO public.entitlements (
  user_id,
  household_id,
  status,
  store,
  product_id,
  expires_at
)
SELECT
  p.id,
  p.household_id,
  'promo',
  'promotional',
  NULL,
  now() + interval '90 days'
FROM public.profiles p
WHERE p.home_setup_set_at IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;
