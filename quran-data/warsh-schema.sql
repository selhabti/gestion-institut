create table if not exists public.quran_warsh_surahs (
  number smallint primary key,
  name_ar text not null,
  name_en text not null,
  name_translit text not null,
  ayah_count smallint not null,
  start_page smallint not null,
  end_page smallint not null,
  juz_start smallint not null,
  juz_end smallint not null,
  hizb_start smallint not null,
  hizb_end smallint not null,
  eighth_start integer not null,
  eighth_end integer not null
);

create table if not exists public.quran_warsh_pages (
  number smallint primary key,
  start_id integer not null,
  start_surah smallint not null,
  start_ayah smallint not null,
  end_id integer not null,
  end_surah smallint not null,
  end_ayah smallint not null,
  line_start smallint not null,
  line_end smallint not null
);

create table if not exists public.quran_warsh_hizbs (
  number smallint primary key,
  juz smallint not null,
  start_id integer not null,
  start_surah smallint not null,
  start_ayah smallint not null,
  start_page smallint not null,
  end_id integer not null,
  end_surah smallint not null,
  end_ayah smallint not null,
  end_page smallint not null
);

create table if not exists public.quran_warsh_eighths (
  number integer primary key,
  hizb smallint not null,
  eighth_index smallint not null,
  juz smallint not null,
  start_id integer not null,
  start_surah smallint not null,
  start_ayah smallint not null,
  start_page smallint not null,
  end_id integer not null,
  end_surah smallint not null,
  end_ayah smallint not null,
  end_page smallint not null,
  source text not null,
  marker boolean not null default false,
  unique (hizb, eighth_index)
);

create table if not exists public.quran_warsh_ayahs (
  id integer primary key,
  surah smallint not null,
  ayah smallint not null,
  text text not null,
  page smallint not null,
  page_end smallint not null,
  spans_pages boolean not null default false,
  juz smallint not null,
  hizb smallint not null,
  eighth integer not null,
  line_start smallint not null,
  line_end smallint not null,
  unique (surah, ayah)
);

create index if not exists quran_warsh_ayahs_page_idx on public.quran_warsh_ayahs (page, surah, ayah);
create index if not exists quran_warsh_ayahs_juz_idx on public.quran_warsh_ayahs (juz, surah, ayah);
create index if not exists quran_warsh_ayahs_hizb_idx on public.quran_warsh_ayahs (hizb, surah, ayah);
create index if not exists quran_warsh_ayahs_eighth_idx on public.quran_warsh_ayahs (eighth, surah, ayah);

alter table public.quran_warsh_surahs enable row level security;
alter table public.quran_warsh_pages enable row level security;
alter table public.quran_warsh_hizbs enable row level security;
alter table public.quran_warsh_eighths enable row level security;
alter table public.quran_warsh_ayahs enable row level security;

drop policy if exists quran_warsh_surahs_select on public.quran_warsh_surahs;
create policy quran_warsh_surahs_select on public.quran_warsh_surahs for select to authenticated using (true);
drop policy if exists quran_warsh_pages_select on public.quran_warsh_pages;
create policy quran_warsh_pages_select on public.quran_warsh_pages for select to authenticated using (true);
drop policy if exists quran_warsh_hizbs_select on public.quran_warsh_hizbs;
create policy quran_warsh_hizbs_select on public.quran_warsh_hizbs for select to authenticated using (true);
drop policy if exists quran_warsh_eighths_select on public.quran_warsh_eighths;
create policy quran_warsh_eighths_select on public.quran_warsh_eighths for select to authenticated using (true);
drop policy if exists quran_warsh_ayahs_select on public.quran_warsh_ayahs;
create policy quran_warsh_ayahs_select on public.quran_warsh_ayahs for select to authenticated using (true);

grant select on public.quran_warsh_surahs to authenticated;
grant select on public.quran_warsh_pages to authenticated;
grant select on public.quran_warsh_hizbs to authenticated;
grant select on public.quran_warsh_eighths to authenticated;
grant select on public.quran_warsh_ayahs to authenticated;
