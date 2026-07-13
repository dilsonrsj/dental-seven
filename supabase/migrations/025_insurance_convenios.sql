-- v8.0: insurance carriers, plans, enrollments, procedure prices, claims
-- Decisão: recebíveis de convênio vivem em insurance_claims (base caixa).
-- Ao marcar guia como paga, um lançamento 'revenue' normal é criado — sem
-- novos valores no enum financial_entry_type.

create type insurance_claim_status as enum (
  'draft',
  'awaiting_auth',
  'authorized',
  'submitted',
  'paid',
  'partial_glosa',
  'glosa',
  'appealing'
);

create table insurance_carriers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  ans_registry text,
  provider_code text,
  portal_url text,
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table insurance_plans (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  carrier_id uuid not null references insurance_carriers(id) on delete cascade,
  name text not null,
  requires_pre_auth boolean not null default false,
  coverage_notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, carrier_id, name)
);

create table patient_insurance_enrollments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  plan_id uuid not null references insurance_plans(id) on delete restrict,
  card_number text not null,
  holder_name text,
  valid_until date,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table insurance_procedure_prices (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  plan_id uuid not null references insurance_plans(id) on delete cascade,
  procedure_id uuid not null references procedures(id) on delete cascade,
  price_cents integer not null check (price_cents >= 0),
  tuss_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, procedure_id)
);

create table insurance_claims (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete restrict,
  plan_id uuid not null references insurance_plans(id) on delete restrict,
  appointment_id uuid references appointments(id) on delete set null,
  procedure_id uuid references procedures(id) on delete set null,
  status insurance_claim_status not null default 'draft',
  auth_password text,
  submitted_amount_cents integer not null default 0 check (submitted_amount_cents >= 0),
  paid_amount_cents integer check (paid_amount_cents >= 0),
  glosa_reason text not null default '',
  glosa_amount_cents integer check (glosa_amount_cents >= 0),
  submitted_at date,
  paid_at date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table appointments
  add column payment_source text not null default 'particular'
    check (payment_source in ('particular', 'insurance')),
  add column insurance_plan_id uuid references insurance_plans(id) on delete set null;

create index idx_insurance_carriers_clinic on insurance_carriers(clinic_id, is_active);
create index idx_insurance_plans_carrier on insurance_plans(carrier_id, is_active);
create index idx_insurance_plans_clinic on insurance_plans(clinic_id, is_active);
create index idx_patient_enrollments_patient on patient_insurance_enrollments(patient_id);
create index idx_patient_enrollments_clinic on patient_insurance_enrollments(clinic_id);
create index idx_insurance_prices_plan on insurance_procedure_prices(plan_id);
create index idx_insurance_prices_clinic on insurance_procedure_prices(clinic_id);
create index idx_insurance_claims_clinic_status on insurance_claims(clinic_id, status);
create index idx_insurance_claims_patient on insurance_claims(patient_id);

alter table insurance_carriers enable row level security;
alter table insurance_plans enable row level security;
alter table patient_insurance_enrollments enable row level security;
alter table insurance_procedure_prices enable row level security;
alter table insurance_claims enable row level security;

create policy "insurance_carriers_clinic" on insurance_carriers for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "insurance_plans_clinic" on insurance_plans for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "patient_insurance_enrollments_clinic" on patient_insurance_enrollments for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "insurance_procedure_prices_clinic" on insurance_procedure_prices for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "insurance_claims_clinic" on insurance_claims for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
