-- Grant service role access to tables that exist
grant select, insert, update on public.topics to service_role;
grant select, insert, update on public.sermons to service_role;

-- Service role full access policies (bypass RLS)
create policy "Service role full access topics" on public.topics for all to service_role using (true) with check (true);
create policy "Service role full access sermons" on public.sermons for all to service_role using (true) with check (true);