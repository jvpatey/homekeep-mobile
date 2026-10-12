-- Cached inspection-report extraction from homekeep-ai, so a report is only
-- read by the model once. Cleared when the file is replaced.

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS ai_extraction jsonb;

COMMENT ON COLUMN public.documents.ai_extraction IS
  'homekeep-ai extract_inspection result: { summary, findings[], extracted_at, storage_path }.';

CREATE OR REPLACE FUNCTION public.clear_document_ai_extraction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.storage_path IS DISTINCT FROM OLD.storage_path THEN
    NEW.ai_extraction := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clear_document_ai_extraction ON public.documents;
CREATE TRIGGER clear_document_ai_extraction
  BEFORE UPDATE OF storage_path ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.clear_document_ai_extraction();
