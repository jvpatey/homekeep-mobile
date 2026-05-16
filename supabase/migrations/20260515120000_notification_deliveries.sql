-- Mirror of notification_deliveries (may already exist if applied in Supabase dashboard)
create table if not exists notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dedupe_key text not null,
  notification_type text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index if not exists notification_deliveries_sent_at_idx
  on notification_deliveries (sent_at);

alter table notification_deliveries enable row level security;
