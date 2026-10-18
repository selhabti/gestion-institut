-- Quran mushaf schema for Neon (attanzil)
-- Generated from Tanzil metadata (CC BY 3.0) + alquran.cloud Uthmani text.

create table if not exists public.quran_surahs (
  number smallint primary key,
  name_ar text not null,
  name_translit text not null,
  name_en text not null,
  revelation text not null,
  ayah_count smallint not null,
  start_page smallint not null,
  end_page smallint not null,
  page_count smallint not null,
  juz_start smallint not null,
  juz_end smallint not null,
  hizb_start smallint not null,
  hizb_end smallint not null,
  rub_start smallint not null,
  rub_end smallint not null,
  first_verse_preview text not null
);

create table if not exists public.quran_pages (
  number smallint primary key,
  start_surah smallint not null,
  start_ayah smallint not null,
  end_surah smallint not null,
  end_ayah smallint not null
);

create table if not exists public.quran_juzs (
  number smallint primary key,
  start_surah smallint not null,
  start_ayah smallint not null,
  end_surah smallint not null,
  end_ayah smallint not null,
  start_page smallint not null,
  end_page smallint not null,
  page_count smallint not null,
  ayah_count smallint not null,
  start_preview text not null
);

create table if not exists public.quran_hizbs (
  number smallint primary key,
  juz smallint not null,
  start_surah smallint not null,
  start_ayah smallint not null,
  end_surah smallint not null,
  end_ayah smallint not null,
  start_page smallint not null,
  end_page smallint not null,
  page_count smallint not null,
  ayah_count smallint not null,
  start_preview text not null
);

create table if not exists public.quran_rubs (
  number smallint primary key,
  hizb smallint not null,
  juz smallint not null,
  quarter_index smallint not null,
  label text not null,
  fraction numeric(3,2) not null,
  start_surah smallint not null,
  start_ayah smallint not null,
  end_surah smallint not null,
  end_ayah smallint not null,
  start_page smallint not null,
  end_page smallint not null,
  page_count smallint not null,
  ayah_count smallint not null,
  start_preview text not null,
  end_preview text not null
);

create table if not exists public.quran_surah_rubs (
  surah smallint not null references public.quran_surahs(number),
  rub smallint not null references public.quran_rubs(number),
  hizb smallint not null,
  label text not null,
  start_key text not null,
  start_page smallint not null,
  start_preview text not null,
  primary key (surah, rub)
);

create table if not exists public.quran_ayahs (
  surah smallint not null references public.quran_surahs(number),
  ayah smallint not null,
  text text not null,
  page smallint not null references public.quran_pages(number),
  juz smallint not null references public.quran_juzs(number),
  hizb smallint not null references public.quran_hizbs(number),
  rub smallint not null references public.quran_rubs(number),
  sajda boolean not null default false,
  sajda_type text,
  primary key (surah, ayah)
);

create index if not exists quran_ayahs_page_idx on public.quran_ayahs (page, surah, ayah);
create index if not exists quran_ayahs_juz_idx on public.quran_ayahs (juz, surah, ayah);
create index if not exists quran_ayahs_hizb_idx on public.quran_ayahs (hizb, surah, ayah);
create index if not exists quran_ayahs_rub_idx on public.quran_ayahs (rub, surah, ayah);
create index if not exists quran_surah_rubs_surah_idx on public.quran_surah_rubs (surah, start_page);

alter table public.quran_surahs enable row level security;
alter table public.quran_pages enable row level security;
alter table public.quran_juzs enable row level security;
alter table public.quran_hizbs enable row level security;
alter table public.quran_rubs enable row level security;
alter table public.quran_surah_rubs enable row level security;
alter table public.quran_ayahs enable row level security;

drop policy if exists quran_surahs_select on public.quran_surahs;
create policy quran_surahs_select on public.quran_surahs for select to authenticated using (true);
drop policy if exists quran_pages_select on public.quran_pages;
create policy quran_pages_select on public.quran_pages for select to authenticated using (true);
drop policy if exists quran_juzs_select on public.quran_juzs;
create policy quran_juzs_select on public.quran_juzs for select to authenticated using (true);
drop policy if exists quran_hizbs_select on public.quran_hizbs;
create policy quran_hizbs_select on public.quran_hizbs for select to authenticated using (true);
drop policy if exists quran_rubs_select on public.quran_rubs;
create policy quran_rubs_select on public.quran_rubs for select to authenticated using (true);
drop policy if exists quran_surah_rubs_select on public.quran_surah_rubs;
create policy quran_surah_rubs_select on public.quran_surah_rubs for select to authenticated using (true);
drop policy if exists quran_ayahs_select on public.quran_ayahs;
create policy quran_ayahs_select on public.quran_ayahs for select to authenticated using (true);

grant select on public.quran_surahs to authenticated;
grant select on public.quran_pages to authenticated;
grant select on public.quran_juzs to authenticated;
grant select on public.quran_hizbs to authenticated;
grant select on public.quran_rubs to authenticated;
grant select on public.quran_surah_rubs to authenticated;
grant select on public.quran_ayahs to authenticated;
