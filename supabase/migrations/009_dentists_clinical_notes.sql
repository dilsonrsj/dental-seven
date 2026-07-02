-- v3.5: dentist profile fields + patient clinical notes

alter table dentists
  add column if not exists cro text,
  add column if not exists specialty text,
  add column if not exists signature_storage_path text;

create table patient_clinical_notes (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  author_id uuid references profiles(id) on delete set null,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index idx_patient_clinical_notes_clinic_patient
  on patient_clinical_notes(clinic_id, patient_id);

create index idx_patient_clinical_notes_patient_created
  on patient_clinical_notes(patient_id, created_at desc);

alter table patient_clinical_notes enable row level security;

create policy "patient_clinical_notes_clinic" on patient_clinical_notes for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
