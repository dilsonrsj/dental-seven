-- v5.1: suppliers + preferred link on supplies

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table supplies
  add column preferred_supplier_id uuid
    references suppliers(id) on delete set null;

create index idx_suppliers_clinic_active_name
  on suppliers(clinic_id, is_active, name);

create index idx_supplies_preferred_supplier
  on supplies(preferred_supplier_id)
  where preferred_supplier_id is not null;

alter table suppliers enable row level security;

create policy "suppliers_clinic" on suppliers for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
