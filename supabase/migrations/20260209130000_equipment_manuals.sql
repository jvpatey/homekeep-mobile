-- Equipment manuals: user-owned inventory rows + private Storage bucket for PDFs/images.

create table if not exists public.equipment_manuals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  model_number text null,
  purchase_date date null,
  manual_storage_path text null,
  manual_mime_type text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists equipment_manuals_user_id_idx
  on public.equipment_manuals (user_id);

alter table public.equipment_manuals enable row level security;

create policy "equipment_manuals_select_own"
  on public.equipment_manuals for select
  to authenticated
  using (auth.uid() = user_id);

create policy "equipment_manuals_insert_own"
  on public.equipment_manuals for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "equipment_manuals_update_own"
  on public.equipment_manuals for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "equipment_manuals_delete_own"
  on public.equipment_manuals for delete
  to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('equipment-manuals', 'equipment-manuals', false)
on conflict (id) do nothing;

-- Objects live at {user_id}/{equipment_id}/{filename}; first path segment must match auth.uid().
create policy "equipment_manuals_storage_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'equipment-manuals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "equipment_manuals_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'equipment-manuals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "equipment_manuals_storage_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'equipment-manuals'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'equipment-manuals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "equipment_manuals_storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'equipment-manuals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
