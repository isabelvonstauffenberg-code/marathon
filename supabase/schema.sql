-- Run this once in the Supabase SQL editor (Project > SQL > New query).
-- Anyone with the link can read and add rows; nobody can edit or delete except you in the dashboard.

create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  runner text not null check (char_length(runner) <= 60),
  spot_id text not null check (char_length(spot_id) <= 60),
  name text not null check (char_length(name) between 1 and 40),
  outfit text check (char_length(outfit) <= 80),
  created_at timestamptz not null default now()
);

create table if not exists sightings (
  id uuid primary key default gen_random_uuid(),
  runner text not null check (char_length(runner) <= 60),
  spot_id text not null check (char_length(spot_id) <= 60),
  mile numeric not null check (mile >= 0 and mile <= 26.3),
  seen_at timestamptz not null,
  name text not null check (char_length(name) between 1 and 40),
  photo_url text check (char_length(photo_url) <= 500),
  created_at timestamptz not null default now()
);

create table if not exists guesses (
  id uuid primary key default gen_random_uuid(),
  runner text not null check (char_length(runner) <= 60),
  name text not null check (char_length(name) between 1 and 40),
  seconds integer not null check (seconds between 7200 and 32400),
  created_at timestamptz not null default now()
);

create table if not exists friends (
  id uuid primary key default gen_random_uuid(),
  runner text not null check (char_length(runner) <= 60),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,40}$'),
  name text not null check (char_length(name) between 1 and 40),
  bib text check (char_length(bib) <= 10),
  gun_time timestamptz not null,
  corral_delay_min integer not null default 0 check (corral_delay_min between 0 and 60),
  pace_fast integer not null check (pace_fast between 240 and 1200),
  pace_goal integer not null check (pace_goal between 240 and 1200),
  pace_slow integer not null check (pace_slow between 240 and 1200),
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  added_by text check (char_length(added_by) <= 40),
  created_at timestamptz not null default now()
);

alter table claims enable row level security;
alter table sightings enable row level security;
alter table guesses enable row level security;
alter table friends enable row level security;

create policy "public read" on claims for select using (true);
create policy "public add" on claims for insert with check (true);
create policy "public read" on sightings for select using (true);
create policy "public add" on sightings for insert with check (seen_at <= now() + interval '5 minutes');
create policy "public read" on guesses for select using (true);
-- Guesses lock at the gun. Update this timestamp if the start time changes.
create policy "public add before gun" on guesses for insert with check (now() < '2026-11-01T09:10:00-05:00');
create policy "public read" on friends for select using (true);
create policy "public add" on friends for insert with check (true);

-- Photo bucket for sightings.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sightings', 'sightings', true, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

create policy "public upload sightings" on storage.objects for insert
  with check (bucket_id = 'sightings');
