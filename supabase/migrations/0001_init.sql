-- ===== Typer =====
create type public.user_role as enum ('admin', 'customer');
create type public.candidate_stage as enum
  ('new', 'screening', 'interview', 'offer', 'hired', 'closed');

-- ===== Tabeller =====
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'customer',
  organization_id uuid references public.organizations(id),
  created_at timestamptz not null default now(),
  -- kunder måste tillhöra en organisation, admin behöver inte
  constraint customer_has_org check (role = 'admin' or organization_id is not null)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  location text,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  unique (id, organization_id)  -- behövs för kopplingen från candidates
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null,
  full_name text not null,
  email text,
  phone text,
  linkedin_url text,
  cv_path text,
  notes text,
  stage public.candidate_stage not null default 'new',
  position double precision not null default 0,
  ai_score int check (ai_score between 1 and 10),
  ai_assessment jsonb,
  ai_scored_at timestamptz,
  created_at timestamptz not null default now(),
  -- en kandidat kan bara kopplas till ett jobb i SAMMA organisation
  foreign key (job_id, organization_id)
    references public.jobs (id, organization_id) on delete cascade
);

create index candidates_org_job_stage_idx
  on public.candidates (organization_id, job_id, stage);

-- ===== Hjälpfunktioner för RLS =====
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create function public.current_org_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

-- ===== RLS =====
alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.jobs          enable row level security;
alter table public.candidates    enable row level security;

-- profiles: läs sin egen rad, admin läser alla. Inga skrivpolicies:
-- profiler skapas bara via edge function (service role).
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- organizations: kund ser sin egen, admin hanterar alla
create policy "orgs_select" on public.organizations for select
  using (public.is_admin() or id = public.current_org_id());
create policy "orgs_admin_write" on public.organizations for all
  using (public.is_admin()) with check (public.is_admin());

-- jobs och candidates: samma organisation, eller admin
create policy "jobs_all" on public.jobs for all
  using (public.is_admin() or organization_id = public.current_org_id())
  with check (public.is_admin() or organization_id = public.current_org_id());

create policy "candidates_all" on public.candidates for all
  using (public.is_admin() or organization_id = public.current_org_id())
  with check (public.is_admin() or organization_id = public.current_org_id());
