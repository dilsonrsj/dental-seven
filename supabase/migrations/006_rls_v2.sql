-- v2: RLS helpers and clinic-scoped policies

create or replace function public.current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id from profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

-- profiles: super_admin reads all
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select" on profiles
  for select using (auth.uid() = id or public.is_super_admin());

-- clinics
drop policy if exists "demo_read_write_clinics" on clinics;
create policy "clinics_select" on clinics
  for select using (id = public.current_clinic_id() or public.is_super_admin());
create policy "clinics_update" on clinics
  for update using (id = public.current_clinic_id() or public.is_super_admin());

-- dentists
drop policy if exists "demo_read_write_dentists" on dentists;
create policy "dentists_clinic" on dentists for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

-- patients
drop policy if exists "demo_read_write_patients" on patients;
create policy "patients_clinic" on patients for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

-- appointments
drop policy if exists "demo_read_write_appointments" on appointments;
create policy "appointments_clinic" on appointments for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

-- whatsapp
drop policy if exists "demo_read_write_threads" on whatsapp_threads;
drop policy if exists "demo_read_write_messages" on whatsapp_messages;
create policy "threads_clinic" on whatsapp_threads for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
create policy "messages_clinic" on whatsapp_messages for all
  using (
    exists (
      select 1 from whatsapp_threads t
      where t.id = thread_id
        and (t.clinic_id = public.current_clinic_id() or public.is_super_admin())
    )
  )
  with check (
    exists (
      select 1 from whatsapp_threads t
      where t.id = thread_id
        and (t.clinic_id = public.current_clinic_id() or public.is_super_admin())
    )
  );

-- clinic_modules
create policy "modules_clinic" on clinic_modules for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
