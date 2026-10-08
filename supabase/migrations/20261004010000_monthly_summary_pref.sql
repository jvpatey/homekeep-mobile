-- Monthly recap push (1st of the month, 10:00 local). On by default and not
-- gated on HomeKeep+.
ALTER TABLE IF EXISTS public.notification_preferences
  ADD COLUMN IF NOT EXISTS monthly_summary boolean NOT NULL DEFAULT true;
