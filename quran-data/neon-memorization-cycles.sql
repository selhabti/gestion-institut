-- 4-week revision cycles and the end-of-cycle total revision.
-- Teacher-facing tracking only: the 30 repetitions per part stay oral for now.

create table if not exists public.memorization_cycles (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  cycle_number integer not null,
  cycle_start date not null,
  cycle_end date not null,
  total_revision_done_at timestamptz,
  notes text,
  parts_snapshot jsonb not null default '[]'::jsonb,
  created_by uuid references neon_auth."user"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, cycle_start)
);

create index if not exists idx_memorization_cycles_member
  on public.memorization_cycles (member_id, cycle_start desc);

alter table public.memorization_cycles enable row level security;

drop policy if exists memorization_cycles_select on public.memorization_cycles;
create policy memorization_cycles_select on public.memorization_cycles
  for select to authenticated using (true);

drop policy if exists memorization_cycles_insert on public.memorization_cycles;
create policy memorization_cycles_insert on public.memorization_cycles
  for insert to authenticated with check (true);

drop policy if exists memorization_cycles_update on public.memorization_cycles;
create policy memorization_cycles_update on public.memorization_cycles
  for update to authenticated using (true) with check (true);

drop policy if exists memorization_cycles_delete on public.memorization_cycles;
create policy memorization_cycles_delete on public.memorization_cycles
  for delete to authenticated using (true);

grant select, insert, update, delete on public.memorization_cycles to authenticated;
