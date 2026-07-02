-- v4: stock ledger + appointment deduction tracking

create type stock_movement_type as enum (
  'inbound',
  'outbound',
  'adjustment',
  'auto_deduction',
  'auto_reversal'
);

alter table supplies
  add column if not exists quantity_on_hand numeric(12, 3) not null default 0,
  add column if not exists min_quantity numeric(12, 3)
    check (min_quantity is null or min_quantity >= 0);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  supply_id uuid not null references supplies(id) on delete restrict,
  movement_type stock_movement_type not null,
  quantity numeric(12, 3) not null check (quantity <> 0),
  quantity_after numeric(12, 3) not null,
  appointment_id uuid references appointments(id) on delete set null,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table appointment_stock_applied (
  appointment_id uuid primary key references appointments(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  deduction_applied_at timestamptz not null default now(),
  reversed_at timestamptz
);

create index idx_stock_movements_supply_created
  on stock_movements(supply_id, created_at desc);

create index idx_stock_movements_clinic_created
  on stock_movements(clinic_id, created_at desc);

create index idx_stock_movements_appointment
  on stock_movements(appointment_id)
  where appointment_id is not null;

alter table stock_movements enable row level security;
alter table appointment_stock_applied enable row level security;

create policy "stock_movements_clinic" on stock_movements for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "appointment_stock_applied_clinic" on appointment_stock_applied for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());
