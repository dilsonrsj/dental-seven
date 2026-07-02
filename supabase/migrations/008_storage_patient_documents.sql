-- v2.5: private bucket for patient document files

insert into storage.buckets (id, name, public)
values ('patient-documents', 'patient-documents', false)
on conflict (id) do update set public = false;

create policy "patient_documents_storage_select" on storage.objects
  for select using (
    bucket_id = 'patient-documents'
    and (
      public.is_super_admin()
      or (storage.foldername(name))[1] = public.current_clinic_id()::text
    )
  );

create policy "patient_documents_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'patient-documents'
    and (storage.foldername(name))[1] = public.current_clinic_id()::text
  );

create policy "patient_documents_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'patient-documents'
    and (
      public.is_super_admin()
      or (storage.foldername(name))[1] = public.current_clinic_id()::text
    )
  );
