-- v3.6: odontograma 3D — registros por dente FDI

create table patient_tooth_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  tooth_number smallint not null,
  status text not null default 'healthy',
  faces text[] not null default '{}',
  note text,
  updated_by uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint patient_tooth_records_tooth_fdi check (
    tooth_number in (
      11,12,13,14,15,16,17,18,
      21,22,23,24,25,26,27,28,
      31,32,33,34,35,36,37,38,
      41,42,43,44,45,46,47,48
    )
  ),
  constraint patient_tooth_records_status check (
    status in (
      'healthy', 'caries', 'restored', 'missing',
      'implant', 'crown', 'root_canal', 'fracture', 'other'
    )
  ),
  unique (patient_id, tooth_number)
);

create index idx_patient_tooth_records_clinic_patient
  on patient_tooth_records(clinic_id, patient_id);

create index idx_patient_tooth_records_patient
  on patient_tooth_records(patient_id);

alter table patient_tooth_records enable row level security;

create policy "patient_tooth_records_clinic" on patient_tooth_records for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
