-- Document vault: household-scoped home documents (insurance, inspections,
-- closing papers, permits, warranties). Files live in the existing
-- equipment-manuals bucket under {user_id}/documents/{document_id}/...
-- Equipment manual/receipt columns on equipment_manuals stay where they are.

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Reserved for multi-home; always null today.
  home_id uuid,
  equipment_id uuid REFERENCES public.equipment_manuals(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'other' CHECK (
    kind IN ('insurance', 'inspection', 'closing', 'permit', 'warranty', 'other')
  ),
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  notes text,
  storage_path text,
  mime_type text,
  issued_on date,
  expires_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.documents IS
  'Home document vault: policies, inspections, closing papers, permits, warranties.';

CREATE INDEX IF NOT EXISTS documents_household_id_idx
  ON public.documents (household_id);
CREATE INDEX IF NOT EXISTS documents_user_id_idx
  ON public.documents (user_id);
CREATE INDEX IF NOT EXISTS documents_equipment_id_idx
  ON public.documents (equipment_id)
  WHERE equipment_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.stamp_document_household()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.household_id IS NULL THEN
    NEW.household_id := public.current_user_household_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stamp_document_household ON public.documents;
CREATE TRIGGER stamp_document_household
  BEFORE INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.stamp_document_household();

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS documents_select_household ON public.documents;
CREATE POLICY documents_select_household ON public.documents
  FOR SELECT USING (
    CASE
      WHEN public.current_user_household_id() IS NOT NULL THEN
        household_id = public.current_user_household_id()
      ELSE user_id = auth.uid()
    END
  );

DROP POLICY IF EXISTS documents_insert_own ON public.documents;
CREATE POLICY documents_insert_own ON public.documents
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (
      household_id IS NULL
      OR household_id = public.current_user_household_id()
    )
  );

DROP POLICY IF EXISTS documents_update_household ON public.documents;
CREATE POLICY documents_update_household ON public.documents
  FOR UPDATE USING (
    user_id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND household_id = public.current_user_household_id()
    )
  );

DROP POLICY IF EXISTS documents_delete_household ON public.documents;
CREATE POLICY documents_delete_household ON public.documents
  FOR DELETE USING (
    user_id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND household_id = public.current_user_household_id()
      AND EXISTS (
        SELECT 1 FROM public.household_members m
        WHERE m.household_id = documents.household_id
          AND m.user_id = auth.uid()
          AND m.role = 'owner'
      )
    )
  );

-- ---------------------------------------------------------------------------
-- equipment-manuals bucket: codify policies that were set in the Dashboard.
-- Policies are additive (OR'd), so these are safe alongside the originals.
-- Writes stay in the uploader's own folder; household members can read
-- each other's files (manuals, receipts, completion photos, documents).
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-manuals', 'equipment-manuals', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS equipment_manuals_insert_own ON storage.objects;
CREATE POLICY equipment_manuals_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'equipment-manuals'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS equipment_manuals_update_own ON storage.objects;
CREATE POLICY equipment_manuals_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'equipment-manuals'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'equipment-manuals'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS equipment_manuals_delete_own ON storage.objects;
CREATE POLICY equipment_manuals_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'equipment-manuals'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS equipment_manuals_select_household ON storage.objects;
CREATE POLICY equipment_manuals_select_household ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'equipment-manuals'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles owner
        WHERE owner.id::text = (storage.foldername(name))[1]
          AND owner.household_id IS NOT NULL
          AND owner.household_id = public.current_user_household_id()
      )
    )
  );
