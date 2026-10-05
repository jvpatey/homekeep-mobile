-- Equipment details (maker, serial, consumables), first-class equipment types
-- for the former hint groups, and paint colours / home notes on profile.

ALTER TABLE public.equipment_manuals
  ADD COLUMN IF NOT EXISTS manufacturer text,
  ADD COLUMN IF NOT EXISTS serial_number text,
  ADD COLUMN IF NOT EXISTS consumables jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.equipment_manuals.consumables IS
  'Array of {id, label, partNumber?, size?, notes?} — filters, bulbs, belts.';

ALTER TABLE public.equipment_manuals
  DROP CONSTRAINT IF EXISTS equipment_manuals_consumables_is_array;
ALTER TABLE public.equipment_manuals
  ADD CONSTRAINT equipment_manuals_consumables_is_array
  CHECK (jsonb_typeof(consumables) = 'array');

ALTER TABLE public.equipment_manuals
  DROP CONSTRAINT IF EXISTS equipment_manuals_equipment_type_check;
ALTER TABLE public.equipment_manuals
  ADD CONSTRAINT equipment_manuals_equipment_type_check
  CHECK (
    equipment_type IS NULL
    OR equipment_type IN (
      'furnace',
      'ac',
      'heat_pump',
      'water_heater',
      'water_softener',
      'fridge',
      'dishwasher',
      'washer',
      'dryer',
      'stove',
      'range_hood',
      'microwave',
      'lawn_mower',
      'other'
    )
  );

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS home_notes jsonb;

COMMENT ON COLUMN public.profiles.home_notes IS
  '{paints: [{id, room, surface?, brand?, colorName, colorCode?, finish?, hex?}], notes: [{id, title, body, updatedAt}]}';
