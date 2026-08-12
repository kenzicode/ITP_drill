-- ============================================================
-- TOEFL ITP Drill — skema Postgres untuk Supabase
-- Jalankan seluruh file ini di SQL Editor, lalu jalankan seed.sql
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- bank soal (publik untuk semua user terautentikasi) ----------
create table if not exists passages (
  id        text primary key,
  kind      text not null check (kind in ('reading','listening')),
  title     text not null,
  body      jsonb,          -- array paragraf, untuk bacaan
  script    jsonb           -- array [pembicara, kalimat], untuk listening
);

create table if not exists questions (
  id          text primary key,
  section     text not null check (section in ('listening','structure','reading')),
  kind        text not null check (kind in ('plain','we','reading','la','lg')),
  skill       text not null,
  stem        text not null,
  opts        jsonb not null,
  ans         int  not null check (ans between 0 and 3),
  exp         text not null,
  passage_id  text references passages(id) on delete set null,
  no_shuffle  boolean not null default false,
  script      jsonb,        -- dialog Part A menempel di soalnya sendiri
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists questions_section_idx on questions(section) where active;
create index if not exists questions_skill_idx   on questions(skill);

-- ---------- data milik user ----------
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  slot        text not null check (slot in ('pagi','siang','sore','diagnostik','ulang')),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  correct     int not null default 0,
  total       int not null default 0
);

create index if not exists sessions_user_idx on sessions(user_id, started_at desc);

create table if not exists attempts (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  session_id   uuid references sessions(id) on delete cascade,
  question_id  text not null references questions(id) on delete cascade,
  picked       int  not null,
  is_correct   boolean not null,
  ms_taken     int,
  answered_at  timestamptz not null default now()
);

create index if not exists attempts_user_idx     on attempts(user_id, answered_at desc);
create index if not exists attempts_user_q_idx   on attempts(user_id, question_id);

-- ---------- RLS ----------
alter table passages  enable row level security;
alter table questions enable row level security;
alter table sessions  enable row level security;
alter table attempts  enable row level security;

drop policy if exists "bank readable" on passages;
create policy "bank readable" on passages
  for select to authenticated using (true);

drop policy if exists "bank readable" on questions;
create policy "bank readable" on questions
  for select to authenticated using (true);

drop policy if exists "own sessions" on sessions;
create policy "own sessions" on sessions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own attempts" on attempts;
create policy "own attempts" on attempts
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- view diagnosis (security_invoker: ikut RLS pemanggil) ----------
create or replace view v_section_stats
with (security_invoker = true) as
select
  q.section,
  count(*)::int                                as answered,
  count(*) filter (where a.is_correct)::int    as correct,
  round(avg(case when a.is_correct then 1 else 0 end)::numeric, 4) as accuracy
from attempts a
join questions q on q.id = a.question_id
group by q.section;

create or replace view v_skill_stats
with (security_invoker = true) as
select
  q.skill,
  q.section,
  count(*)::int                             as answered,
  count(*) filter (where a.is_correct)::int as correct,
  round(avg(case when a.is_correct then 1 else 0 end)::numeric, 4) as accuracy,
  max(a.answered_at)                        as last_seen
from attempts a
join questions q on q.id = a.question_id
group by q.skill, q.section;

-- riwayat per soal: dipakai untuk rotasi dan antrean pengulangan
create or replace view v_question_state
with (security_invoker = true) as
select
  q.id                                                          as question_id,
  count(a.id)::int                                              as seen,
  count(a.id) filter (where not a.is_correct)::int              as wrong,
  max(a.answered_at)                                            as last_seen,
  bool_or(a.is_correct) filter (
    where a.answered_at = (select max(a2.answered_at) from attempts a2
                           where a2.question_id = q.id and a2.user_id = a.user_id)
  )                                                             as last_correct
from questions q
left join attempts a on a.question_id = q.id
group by q.id;
