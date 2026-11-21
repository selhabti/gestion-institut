-- Mémo V2 : positions en 1/8 de hizb, séances du samedi, table de repères.
-- Prérequis : public.is_staff(uuid) et public.has_permission(uuid, text) existent déjà.

create table if not exists public.eleves_memo (
  eleve_id        uuid primary key references public.members(id),
  riwaya          text not null check (riwaya in ('hafs','warsh')),
  sens            text not null default 'fatiha_vers_nas'
                    check (sens in ('fatiha_vers_nas','nas_vers_fatiha')),
  date_debut      date not null,
  position_origine int not null default 0 check (position_origine between 0 and 480),
  position_depart int  not null default 0 check (position_depart between 0 and 480),
  rythme          int  not null default 2 check (rythme > 0),
  quota_revision  int  not null default 8 check (quota_revision > 0),
  position        int  not null default 0,
  pointeur_rev    int  not null default 0,
  cycles_faits    int  not null default 0,
  updated_at      timestamptz default now(),
  constraint eleves_memo_origine_le_depart
    check (position_origine <= position_depart)
);

create table if not exists public.seances (
  id              uuid primary key default gen_random_uuid(),
  eleve_id        uuid not null references public.members(id),
  samedi          date not null check (extract(isodow from samedi) = 6),
  nouveau_de      int not null,
  nouveau_a       int not null,
  recent_de       int not null,
  recent_a        int not null,
  ancien_de       int,
  ancien_a        int,
  nouveau_statut  text check (nouveau_statut in ('valide','partiel','refaire','absent')),
  nouveau_atteint int,
  recent_ok       boolean,
  ancien_ok       boolean,
  note            int check (note between 1 and 5),
  commentaire     text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (eleve_id, samedi)
);

create table if not exists public.reperes (
  riwaya   text not null,
  sens     text not null,
  huitieme int  not null check (huitieme between 0 and 480),
  sourate  int not null,
  verset   int not null,
  page     int not null,
  exact    boolean not null default true,
  primary key (riwaya, sens, huitieme)
);

create index if not exists seances_eleve_samedi_idx
  on public.seances (eleve_id, samedi);

alter table public.eleves_memo enable row level security;
alter table public.seances enable row level security;
alter table public.reperes enable row level security;

drop policy if exists eleves_memo_select on public.eleves_memo;
create policy eleves_memo_select on public.eleves_memo
  for select to authenticated using (public.is_staff(auth.uid()));

drop policy if exists eleves_memo_write on public.eleves_memo;
create policy eleves_memo_write on public.eleves_memo
  for all to authenticated
  using (public.has_permission(auth.uid(), 'recitations'))
  with check (public.has_permission(auth.uid(), 'recitations'));

drop policy if exists seances_select on public.seances;
create policy seances_select on public.seances
  for select to authenticated using (public.is_staff(auth.uid()));

drop policy if exists seances_write on public.seances;
create policy seances_write on public.seances
  for all to authenticated
  using (public.has_permission(auth.uid(), 'recitations'))
  with check (public.has_permission(auth.uid(), 'recitations'));

drop policy if exists reperes_select on public.reperes;
create policy reperes_select on public.reperes
  for select to authenticated using (public.is_staff(auth.uid()));

grant select, insert, update, delete on public.eleves_memo to authenticated;
grant select, insert, update, delete on public.seances to authenticated;
grant select on public.reperes to authenticated;
