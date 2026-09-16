-- Allow authenticated users to upsert their own store-managed Plus entitlement
-- from RevenueCat CustomerInfo (covers trials + paid when webhook is missing).

CREATE OR REPLACE FUNCTION public.upsert_my_store_entitlement(
  p_status text,
  p_product_id text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL,
  p_store text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  hh uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('trialing', 'active', 'grace') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  IF p_store IS NOT NULL AND p_store NOT IN ('app_store', 'play_store') THEN
    RAISE EXCEPTION 'Invalid store: %', p_store;
  END IF;

  SELECT household_id INTO hh FROM public.profiles WHERE id = uid;

  INSERT INTO public.entitlements (
    user_id,
    household_id,
    status,
    store,
    product_id,
    expires_at,
    revenuecat_app_user_id,
    updated_at
  )
  VALUES (
    uid,
    hh,
    p_status,
    p_store,
    p_product_id,
    p_expires_at,
    uid::text,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    household_id = EXCLUDED.household_id,
    status = EXCLUDED.status,
    store = COALESCE(EXCLUDED.store, public.entitlements.store),
    product_id = COALESCE(EXCLUDED.product_id, public.entitlements.product_id),
    expires_at = EXCLUDED.expires_at,
    revenuecat_app_user_id = EXCLUDED.revenuecat_app_user_id,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_my_store_entitlement(text, text, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_my_store_entitlement(text, text, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_my_store_entitlement(text, text, timestamptz, text) TO service_role;
