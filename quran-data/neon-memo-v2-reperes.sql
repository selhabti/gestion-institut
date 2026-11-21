-- Remplissage de public.reperes (sens appris : fatiha -> nas uniquement).
--
-- Convention de position :
--   huitieme = p  ->  repère situé APRÈS p huitièmes, c'est-à-dire le début du (p+1)-ième.
--   Ainsi une plage [de, a[ part du repère de `de` et se termine juste AVANT le repère de `a`.
--   p = 0 -> 1:1 ; p = 480 -> sentinelle de fin (114:6).
--
-- Warsh : exact pour 41 hizbs ; 30 bornes interpolées (marqueurs ۞ manquants dans la source)
--         sont marquées exact = false (liste ci-dessous).
-- Hafs  : 1/8 pair -> quart h/2 (exact) ; 1/8 impair -> quart précédent (exact = false).

-- ---- Warsh ----
insert into public.reperes (riwaya, sens, huitieme, sourate, verset, page, exact)
select
  'warsh',
  'fatiha_vers_nas',
  w.number - 1,
  w.start_surah,
  w.start_ayah,
  w.start_page,
  not ((w.number - 1) = any (array[
    103,207,215,239,295,311,335,343,367,375,
    399,414,415,431,438,439,445,446,447,455,
    462,463,469,470,471,475,476,477,478,479
  ]::int[]))
from public.quran_warsh_eighths w
where w.number between 1 and 480
on conflict (riwaya, sens, huitieme) do update
  set sourate = excluded.sourate,
      verset  = excluded.verset,
      page    = excluded.page,
      exact   = excluded.exact;

insert into public.reperes (riwaya, sens, huitieme, sourate, verset, page, exact)
values ('warsh', 'fatiha_vers_nas', 480, 114, 6, 604, true)
on conflict (riwaya, sens, huitieme) do update
  set sourate = excluded.sourate,
      verset  = excluded.verset,
      page    = excluded.page,
      exact   = excluded.exact;

-- ---- Hafs ----
insert into public.reperes (riwaya, sens, huitieme, sourate, verset, page, exact)
select
  'hafs',
  'fatiha_vers_nas',
  gs.h,
  r.start_surah,
  r.start_ayah,
  r.start_page,
  (gs.h % 2 = 0)
from generate_series(1, 479) as gs(h)
join public.quran_rubs r
  on r.number = case
       when gs.h % 2 = 0 then gs.h / 2
       else greatest(1, (gs.h - 1) / 2)
     end
on conflict (riwaya, sens, huitieme) do update
  set sourate = excluded.sourate,
      verset  = excluded.verset,
      page    = excluded.page,
      exact   = excluded.exact;

insert into public.reperes (riwaya, sens, huitieme, sourate, verset, page, exact)
values
  ('hafs', 'fatiha_vers_nas', 0, 1, 1, 1, true),
  ('hafs', 'fatiha_vers_nas', 480, 114, 6, 604, true)
on conflict (riwaya, sens, huitieme) do update
  set sourate = excluded.sourate,
      verset  = excluded.verset,
      page    = excluded.page,
      exact   = excluded.exact;
