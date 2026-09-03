-- Profile photos: cropped display JPEG plus original for repositioning.
-- Household members can read each other's avatars; only the owner can write.
-- Leave any existing profiles.avatar_url column untouched (older schema).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_storage_path text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_original_path text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_crop jsonb;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,
  5242880,
  ARRAY['image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS avatars_insert_own ON storage.objects;
CREATE POLICY avatars_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_update_own ON storage.objects;
CREATE POLICY avatars_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_delete_own ON storage.objects;
CREATE POLICY avatars_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_select_household ON storage.objects;
CREATE POLICY avatars_select_household ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
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
