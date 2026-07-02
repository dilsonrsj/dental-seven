-- v3.5: private bucket for clinic assets (dentist signatures)

insert into storage.buckets (id, name, public)
values ('clinic-assets', 'clinic-assets', false)
on conflict (id) do update set public = false;

create policy "clinic_assets_storage_select" on storage.objects
  for select using (
    bucket_id = 'clinic-assets'
    and (
      public.is_super_admin()
      or (storage.foldername(name))[1] = public.current_clinic_id()::text
    )
  );

create policy "clinic_assets_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'clinic-assets'
    and (storage.foldername(name))[1] = public.current_clinic_id()::text
  );

create policy "clinic_assets_storage_update" on storage.objects
  for update using (
    bucket_id = 'clinic-assets'
    and (storage.foldername(name))[1] = public.current_clinic_id()::text
  );

create policy "clinic_assets_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'clinic-assets'
    and (
      public.is_super_admin()
      or (storage.foldername(name))[1] = public.current_clinic_id()::text
    )
  );
