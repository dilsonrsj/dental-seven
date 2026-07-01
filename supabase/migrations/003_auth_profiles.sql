-- v2: profiles linked to Supabase Auth users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'clinic_admin', 'dentist')),
  clinic_id uuid references clinics(id) on delete set null,
  dentist_id uuid references dentists(id) on delete set null,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create index idx_profiles_clinic on profiles(clinic_id);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);
