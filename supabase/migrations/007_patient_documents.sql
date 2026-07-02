-- v2.5: patient document metadata (files in Supabase Storage)

create table patient_documents (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  title text not null,
  mime_type text not null,
  storage_path text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  source text not null default 'imported'
    check (source in ('imported', 'generated', 'clinical')),
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_patient_documents_clinic_patient
  on patient_documents(clinic_id, patient_id);

create index idx_patient_documents_patient_created
  on patient_documents(patient_id, created_at desc);

alter table patient_documents enable row level security;

create policy "patient_documents_clinic" on patient_documents for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
