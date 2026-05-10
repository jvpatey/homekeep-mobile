-- Home address fields on profiles. address_set_at != null doubles as
-- the "user has completed (or skipped) the address onboarding" flag.

alter table public.profiles
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists postal_code text,
  add column if not exists country text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists address_set_at timestamptz;
