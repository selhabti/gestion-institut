-- Dernière page Mushaf consultée par élève (Attanzil)
create table if not exists public.mushaf_progress (
  member_id uuid primary key references public.members(id) on delete cascade,
  page integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.mushaf_progress enable row level security;

drop policy if exists mushaf_progress_select on public.mushaf_progress;
create policy mushaf_progress_select on public.mushaf_progress
  for select to authenticated using (public.is_staff(auth.uid()));

drop policy if exists mushaf_progress_write on public.mushaf_progress;
create policy mushaf_progress_write on public.mushaf_progress
  for all to authenticated
  using (public.has_permission(auth.uid(), 'recitations'))
  with check (public.has_permission(auth.uid(), 'recitations'));

grant select, insert, update on public.mushaf_progress to authenticated;
