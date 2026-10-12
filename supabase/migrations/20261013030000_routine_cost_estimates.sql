-- Expected cost per occurrence for plan-created routines, copied from the
-- bundled template at insert time (routines don't keep a template id).
-- Powers "expected annual upkeep" in onboarding and budget-vs-actual on the ledger.

ALTER TABLE public.maintenance_routines
  ADD COLUMN IF NOT EXISTS estimated_cost_diy numeric(10, 2),
  ADD COLUMN IF NOT EXISTS estimated_cost_pro numeric(10, 2);

ALTER TABLE public.maintenance_routines
  DROP CONSTRAINT IF EXISTS maintenance_routines_estimated_cost_check;

ALTER TABLE public.maintenance_routines
  ADD CONSTRAINT maintenance_routines_estimated_cost_check CHECK (
    (estimated_cost_diy IS NULL OR estimated_cost_diy >= 0)
    AND (estimated_cost_pro IS NULL OR estimated_cost_pro >= 0)
  );
