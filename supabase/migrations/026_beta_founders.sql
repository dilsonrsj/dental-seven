-- Founding Members: captura de beta testers antes do cadastro na plataforma

create table beta_founders (
  id uuid primary key default gen_random_uuid(),
  access_token uuid not null unique default gen_random_uuid(),
  full_name text not null,
  clinic_name text not null,
  city text not null,
  state char(2) not null,
  whatsapp text not null,
  email text not null,
  dentist_count text not null check (dentist_count in ('1', '2', '3+')),
  current_system text,
  main_pain text not null,
  invite_ref text,
  accepted_terms boolean not null default false,
  marketing_consent boolean not null default false,
  feedback_status text not null default 'pending'
    check (feedback_status in ('pending', 'sent', 'follow_up')),
  founding_tier text not null default 'founding_member',
  clinic_id uuid references clinics(id) on delete set null,
  created_at timestamptz not null default now(),
  accessed_at timestamptz,
  signup_completed_at timestamptz
);

create unique index beta_founders_email_unique on beta_founders (lower(email));
create index beta_founders_access_token_idx on beta_founders (access_token);
create index beta_founders_whatsapp_idx on beta_founders (whatsapp);
create index beta_founders_created_at_idx on beta_founders (created_at desc);

alter table beta_founders enable row level security;

-- Sem policies para anon/authenticated: leitura/escrita só via service role (server actions).

comment on table beta_founders is 'Programa Founding Members — formulário /founding antes do cadastro beta';
