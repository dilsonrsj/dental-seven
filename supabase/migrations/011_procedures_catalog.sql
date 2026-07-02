-- v3: procedures catalog + supplies BOM

create table procedures (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  base_price_cents integer not null default 0 check (base_price_cents >= 0),
  default_duration_min integer not null default 30 check (default_duration_min > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table supplies (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  unit_label text not null default 'un',
  unit_cost_cents integer check (unit_cost_cents is null or unit_cost_cents >= 0),
  sku text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table procedure_supply_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  procedure_id uuid not null references procedures(id) on delete cascade,
  supply_id uuid not null references supplies(id) on delete restrict,
  quantity numeric(12, 3) not null check (quantity > 0),
  unique (procedure_id, supply_id)
);

alter table appointments
  add column if not exists procedure_id uuid references procedures(id) on delete set null;

create index idx_procedures_clinic_active_name
  on procedures(clinic_id, is_active, name);

create index idx_supplies_clinic_active_name
  on supplies(clinic_id, is_active, name);

create index idx_procedure_supply_items_procedure
  on procedure_supply_items(procedure_id);

create index idx_procedure_supply_items_clinic
  on procedure_supply_items(clinic_id);

create index idx_appointments_procedure_id
  on appointments(procedure_id)
  where procedure_id is not null;

alter table procedures enable row level security;
alter table supplies enable row level security;
alter table procedure_supply_items enable row level security;

create policy "procedures_clinic" on procedures for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "supplies_clinic" on supplies for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "procedure_supply_items_clinic" on procedure_supply_items for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
