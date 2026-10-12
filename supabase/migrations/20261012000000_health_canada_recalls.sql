-- Recalls by country: homes in Canada are matched against Health Canada's
-- consumer product recalls, US (and address-less) homes against CPSC.

ALTER TABLE public.equipment_recalls
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'cpsc';

ALTER TABLE public.equipment_recalls
  DROP CONSTRAINT IF EXISTS equipment_recalls_source_check;
ALTER TABLE public.equipment_recalls
  ADD CONSTRAINT equipment_recalls_source_check
  CHECK (source IN ('cpsc', 'health_canada'));

COMMENT ON TABLE public.equipment_recalls IS
  'Product recalls (CPSC or Health Canada, by home country) matched to equipment by manufacturer and model number.';

-- Health Canada has no incremental API; the scan re-reads the daily feed and
-- uses this as its "updated since" window.
ALTER TABLE public.recall_scan_state
  ADD COLUMN IF NOT EXISTS ca_last_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS ca_last_full_run_at timestamptz;

-- Parsed Health Canada recall pages, so each page is fetched once per update.
CREATE TABLE IF NOT EXISTS public.health_canada_recall_details (
  nid text PRIMARY KEY,
  -- Feed "Last updated"; a change triggers a re-fetch.
  last_updated text,
  recall_number text NOT NULL,
  recall_date date,
  hazard text,
  remedy text,
  product_text text,
  companies text[] NOT NULL DEFAULT '{}',
  fetched_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.health_canada_recall_details IS
  'Cache of parsed recalls-rappels.canada.ca detail pages for recall-scan.';

-- No policies: service role only.
ALTER TABLE public.health_canada_recall_details ENABLE ROW LEVEL SECURITY;
