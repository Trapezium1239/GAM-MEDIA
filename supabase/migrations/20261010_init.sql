create table topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

create table sermons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  preacher text not null,
  date date not null,
  duration text,
  r2_key text not null,
  topic_id uuid references topics(id),
  created_at timestamptz default now()
);

-- Full-text search index (Server fallback)
create materialized view sermons_search as
select s.id, s.title, s.preacher, s.date, s.duration, s.r2_key, t.name as topic_name,
       to_tsvector('english', s.title || ' ' || s.preacher || ' ' || coalesce(t.name, '')) as search_vec
from sermons s left join topics t on s.topic_id = t.id;

create index sermons_search_vec_idx on sermons_search using gin (search_vec);

-- Enable RLS & Public Read Access
alter table sermons enable row level security;
alter table topics enable row level security;

create policy "Public read sermons" on sermons for select using (true);
create policy "Public read topics" on topics for select using (true);