-- ============================================================
-- RecruitIQ — Supabase Schema
-- Run this in your Supabase SQL editor (in order)
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- POOLS
-- ─────────────────────────────────────────
create table pools (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  color       text not null default '#c8b560',
  stages      text[] not null default array['New Lead','Screening','Interview','Offer','Placed'],
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Seed default pools
insert into pools (name, color, stages) values
  ('Testing Roles',    '#c8b560', array['New Lead','Screening','Phone Call','Interview','Offer Sent','Placed']),
  ('Data Engineers',   '#60a5fa', array['New Lead','Technical Screen','Interview','Coding Test','Offer','Placed']),
  ('Project Managers', '#4ade80', array['New Lead','Screening','Interview','Reference Check','Offer','Placed']);

-- ─────────────────────────────────────────
-- CANDIDATES
-- ─────────────────────────────────────────
create table candidates (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  role          text,
  company       text,
  location      text,
  experience    text,
  notice_period text,
  salary        text,
  work_auth     text,
  linkedin_url  text,
  languages     text[] default array[]::text[],
  skills        text[] default array[]::text[],   -- keyword tags extracted by Groq
  notes         text,
  next_action   text,
  pool_id       uuid references pools(id) on delete set null,
  stage         text not null default 'New Lead',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Full-text search index on skills + name + role
create index candidates_skills_gin  on candidates using gin(skills);
create index candidates_name_search on candidates using gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(role,'') || ' ' || coalesce(location,'')));

-- ─────────────────────────────────────────
-- COMMUNICATIONS
-- ─────────────────────────────────────────
create table communications (
  id             uuid primary key default uuid_generate_v4(),
  candidate_id   uuid not null references candidates(id) on delete cascade,
  channel        text not null default 'LinkedIn',   -- LinkedIn | Email | Phone | WhatsApp
  direction      text not null default 'out',        -- out | in
  message        text not null,
  communicated_at timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create index comms_candidate_id on communications(candidate_id);
create index comms_communicated_at on communications(communicated_at desc);

-- ─────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_candidates_updated_at
  before update on candidates
  for each row execute function set_updated_at();

create trigger trg_pools_updated_at
  before update on pools
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────
-- HELPFUL VIEWS
-- ─────────────────────────────────────────

-- Candidate with last communication date
create view candidates_with_last_contact as
select
  c.*,
  p.name        as pool_name,
  p.color       as pool_color,
  p.stages      as pool_stages,
  lc.last_contact_at,
  lc.last_contact_dir,
  lc.last_message,
  extract(day from now() - lc.last_contact_at)::int as days_since_contact
from candidates c
left join pools p on p.id = c.pool_id
left join lateral (
  select communicated_at as last_contact_at, direction as last_contact_dir, message as last_message
  from communications
  where candidate_id = c.id
  order by communicated_at desc
  limit 1
) lc on true;

-- Stale candidates (no contact in 14+ days)
create view stale_candidates as
select * from candidates_with_last_contact
where last_contact_at < now() - interval '14 days'
   or last_contact_at is null
order by days_since_contact desc nulls first;

-- Pipeline summary per pool+stage
create view pipeline_summary as
select
  p.id   as pool_id,
  p.name as pool_name,
  p.color,
  c.stage,
  count(*) as candidate_count
from candidates c
join pools p on p.id = c.pool_id
group by p.id, p.name, p.color, c.stage;

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY (enable when adding auth)
-- ─────────────────────────────────────────
-- alter table pools          enable row level security;
-- alter table candidates     enable row level security;
-- alter table communications enable row level security;
--
-- Example policy (all authenticated users can read/write):
-- create policy "auth_all" on candidates for all using (auth.role() = 'authenticated');
-- Uncomment and customise when you add Supabase Auth.
