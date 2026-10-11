-- Create church_music table
create table if not exists public.church_music (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_choir text not null,
  audio_url text not null,
  lyrics text,
  release_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create programs table
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date timestamptz not null,
  venue text not null,
  flyer_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create devotionals table
create table if not exists public.devotionals (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  title text not null,
  scripture_reference text not null,
  scripture_text text not null,
  reflection text not null,
  prayer text,
  application_question text,
  source text not null default 'manual',
  created_at timestamptz default now(),
  published_at timestamptz default now()
);

-- Create church_directory table (for bank accounts, etc.)
create table if not exists public.church_directory (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  detail_value text not null,
  extra_meta text,
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  interested_unit text,
  prayer_request text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create rosters table
create table if not exists public.rosters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null,
  shift_date date not null,
  status text default 'scheduled',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create milestones table
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  target_amount numeric,
  current_amount numeric default 0,
  target_date date,
  status text default 'planned',
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create admin_users table
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'editor',
  created_at timestamptz default now()
);

-- Enable RLS on new tables
alter table public.church_music enable row level security;
alter table public.programs enable row level security;
alter table public.devotionals enable row level security;
alter table public.church_directory enable row level security;
alter table public.profiles enable row level security;
alter table public.rosters enable row level security;
alter table public.milestones enable row level security;
alter table public.admin_users enable row level security;

-- Public read policies
create policy "Public read church_music" on public.church_music for select using (true);
create policy "Public read programs" on public.programs for select using (true);
create policy "Public read devotionals" on public.devotionals for select using (true);
create policy "Public read church_directory" on public.church_directory for select using (true);
create policy "Public read profiles" on public.profiles for select using (auth.uid() = user_id);
create policy "Public read rosters" on public.rosters for select using (auth.uid() = user_id);
create policy "Public read milestones" on public.milestones for select using (true);
create policy "Public read admin_users" on public.admin_users for select using (auth.uid() = user_id);

-- Service role full access policies
create policy "Service role full access" on public.church_music for all to service_role using (true) with check (true);
create policy "Service role full access" on public.programs for all to service_role using (true) with check (true);
create policy "Service role full access" on public.devotionals for all to service_role using (true) with check (true);
create policy "Service role full access" on public.church_directory for all to service_role using (true) with check (true);
create policy "Service role full access" on public.profiles for all to service_role using (true) with check (true);
create policy "Service role full access" on public.rosters for all to service_role using (true) with check (true);
create policy "Service role full access" on public.milestones for all to service_role using (true) with check (true);
create policy "Service role full access" on public.admin_users for all to service_role using (true) with check (true);

-- Grant service role access
grant select, insert, update, delete on public.church_music to service_role;
grant select, insert, update, delete on public.programs to service_role;
grant select, insert, update, delete on public.devotionals to service_role;
grant select, insert, update, delete on public.church_directory to service_role;
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.rosters to service_role;
grant select, insert, update, delete on public.milestones to service_role;
grant select, insert, update, delete on public.admin_users to service_role;