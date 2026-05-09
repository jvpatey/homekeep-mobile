-- Guided maintenance plans persist provenance on created routines for dashboard tinting.
alter table public.maintenance_routines
  add column if not exists source_plan_id text null;

comment on column public.maintenance_routines.source_plan_id is
  'Optional id of bundled plan (e.g. spring-refresh) when routine was added via Maintenance Plans; null for manual routines.';
