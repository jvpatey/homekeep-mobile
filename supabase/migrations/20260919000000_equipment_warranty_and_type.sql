-- Proof-of-care: warranty expiry + equipment type for cadence hints.

ALTER TABLE public.equipment_manuals
  ADD COLUMN IF NOT EXISTS warranty_expires_on date;

ALTER TABLE public.equipment_manuals
  ADD COLUMN IF NOT EXISTS equipment_type text;

COMMENT ON COLUMN public.equipment_manuals.warranty_expires_on IS
  'Optional warranty end date for proof-of-care summary.';

COMMENT ON COLUMN public.equipment_manuals.equipment_type IS
  'Optional type for reminder cadence hints (furnace, ac, etc.).';

ALTER TABLE public.equipment_manuals
  DROP CONSTRAINT IF EXISTS equipment_manuals_equipment_type_check;

ALTER TABLE public.equipment_manuals
  ADD CONSTRAINT equipment_manuals_equipment_type_check
  CHECK (
    equipment_type IS NULL
    OR equipment_type IN (
      'furnace',
      'ac',
      'water_heater',
      'fridge',
      'washer',
      'dryer',
      'other'
    )
  );
