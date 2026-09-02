-- Attribute completions to the person who marked them done.
-- Snapshot the name so history still reads after someone leaves the household.

ALTER TABLE routine_instances
  ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE routine_instances
  ADD COLUMN IF NOT EXISTS completed_by_name text;

CREATE INDEX IF NOT EXISTS routine_instances_completed_by_idx
  ON routine_instances (completed_by);

CREATE OR REPLACE FUNCTION public.stamp_routine_instance_completer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  label text;
BEGIN
  IF NEW.is_completed IS TRUE THEN
    IF TG_OP = 'INSERT' OR OLD.is_completed IS DISTINCT FROM TRUE THEN
      IF auth.uid() IS NOT NULL THEN
        NEW.completed_by := auth.uid();
      END IF;

      SELECT COALESCE(
        NULLIF(btrim(p.full_name), ''),
        NULLIF(btrim(p.email), '')
      )
      INTO label
      FROM public.profiles p
      WHERE p.id = COALESCE(NEW.completed_by, auth.uid());

      IF label IS NOT NULL THEN
        NEW.completed_by_name := label;
      ELSIF NEW.completed_by_name IS NOT NULL THEN
        NEW.completed_by_name := NULLIF(btrim(NEW.completed_by_name), '');
      END IF;
    END IF;
  ELSE
    NEW.completed_by := NULL;
    NEW.completed_by_name := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stamp_routine_instance_completer ON routine_instances;
CREATE TRIGGER stamp_routine_instance_completer
  BEFORE INSERT OR UPDATE ON routine_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_routine_instance_completer();
