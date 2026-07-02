-- v5: financial ledger

create type financial_entry_type as enum (
  'revenue',
  'revenue_reversal',
  'variable_cost',
  'variable_cost_reversal',
  'manual_revenue',
  'manual_expense'
);

create type financial_entry_source as enum ('auto', 'manual');

create table clinic_monthly_settings (
  clinic_id uuid not null references clinics(id) on delete cascade,
  year_month text not null check (year_month ~ '^\d{4}-\d{2}$'),
  fixed_costs_cents integer not null default 0 check (fixed_costs_cents >= 0),
  updated_at timestamptz not null default now(),
  primary key (clinic_id, year_month)
);

create table financial_entries (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  entry_type financial_entry_type not null,
  source financial_entry_source not null,
  amount_cents integer not null check (amount_cents <> 0),
  appointment_id uuid references appointments(id) on delete set null,
  procedure_id uuid references procedures(id) on delete set null,
  dentist_id uuid references dentists(id) on delete set null,
  description text not null,
  entry_date date not null default (current_date),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table appointment_finance_applied (
  appointment_id uuid primary key references appointments(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  applied_at timestamptz not null default now(),
  reversed_at timestamptz
);

create index idx_financial_entries_clinic_date
  on financial_entries(clinic_id, entry_date desc);

create index idx_financial_entries_appointment
  on financial_entries(appointment_id)
  where appointment_id is not null;

create index idx_financial_entries_dentist_date
  on financial_entries(dentist_id, entry_date desc)
  where dentist_id is not null;

alter table clinic_monthly_settings enable row level security;
alter table financial_entries enable row level security;
alter table appointment_finance_applied enable row level security;

create policy "clinic_monthly_settings_clinic" on clinic_monthly_settings for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "financial_entries_clinic" on financial_entries for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "appointment_finance_applied_clinic" on appointment_finance_applied for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
