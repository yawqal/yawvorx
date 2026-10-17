-- NOT RUN - owner runs in Supabase
-- Adds the database-backed services catalog and confirms public-read/admin-write policies.

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 1 and 100 and slug !~ '[^a-z0-9-]'),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  deliverables text[] not null default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists yvx_services_published_idx on public.services (is_published, created_at desc);

alter table public.services enable row level security;
revoke all on public.services from anon, authenticated;
grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;

drop policy if exists "yvx: public read published services" on public.services;
create policy "yvx: public read published services" on public.services
  for select to anon, authenticated using (is_published);
drop policy if exists "yvx: admin manage services" on public.services;
create policy "yvx: admin manage services" on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.portfolio_projects enable row level security;
drop policy if exists "yvx: public read published projects" on public.portfolio_projects;
create policy "yvx: public read published projects" on public.portfolio_projects
  for select to anon, authenticated using (is_published);
drop policy if exists "yvx: admin all projects" on public.portfolio_projects;
create policy "yvx: admin all projects" on public.portfolio_projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
