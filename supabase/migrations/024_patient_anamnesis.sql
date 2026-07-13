-- v3.7: structured patient anamnesis (one active record per patient)

create table patient_anamnesis (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  template_version text not null default 'v1',
  responses jsonb not null default '{}',
  has_critical_alert boolean not null default false,
  filled_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id)
);

create index idx_patient_anamnesis_clinic_patient
  on patient_anamnesis(clinic_id, patient_id);

alter table patient_anamnesis enable row level security;

create policy "patient_anamnesis_clinic" on patient_anamnesis for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
