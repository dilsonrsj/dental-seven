-- Feedback estruturado da beta (NPS + módulos)

create table beta_feedback (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete set null,
  profile_id uuid references profiles(id) on delete set null,
  nps smallint not null check (nps between 0 and 10),
  top_module text not null check (
    top_module in ('agenda', 'pacientes', 'prontuario', 'outro')
  ),
  liked_most text not null,
  blocked_or_missing text not null,
  would_use_today text not null check (
    would_use_today in ('yes', 'maybe', 'no')
  ),
  notes text,
  created_at timestamptz not null default now()
);

create index beta_feedback_created_at_idx on beta_feedback (created_at desc);
create index beta_feedback_clinic_id_idx on beta_feedback (clinic_id);

alter table beta_feedback enable row level security;

-- Sem policies para anon/authenticated: insert/select via service role.

comment on table beta_feedback is 'Feedback estruturado dos testadores da beta Dental Seven';
