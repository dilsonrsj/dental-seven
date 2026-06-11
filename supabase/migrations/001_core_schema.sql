-- Dental Seven MVP core schema
create extension if not exists "pgcrypto";

create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table dentists (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  color text not null default '#4490E2',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  phone text,
  whatsapp text,
  birth_date date,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type appointment_status as enum (
  'confirmed', 'pending', 'cancelled', 'completed'
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  dentist_id uuid not null references dentists(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_min integer not null default 30,
  status appointment_status not null default 'pending',
  procedure_label text not null default 'Consulta',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type message_direction as enum ('inbound', 'outbound');
create type message_status as enum ('sent', 'delivered', 'read');

create table whatsapp_threads (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references whatsapp_threads(id) on delete cascade,
  direction message_direction not null,
  body text not null,
  sent_at timestamptz not null default now(),
  status message_status not null default 'sent'
);

create index idx_appointments_clinic_starts on appointments(clinic_id, starts_at);
create index idx_patients_clinic_name on patients(clinic_id, name);
create index idx_dentists_clinic on dentists(clinic_id);

-- MVP: permissive RLS (gate is app-level cookie)
alter table clinics enable row level security;
alter table dentists enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table whatsapp_threads enable row level security;
alter table whatsapp_messages enable row level security;

create policy "demo_read_write_clinics" on clinics for all using (true) with check (true);
create policy "demo_read_write_dentists" on dentists for all using (true) with check (true);
create policy "demo_read_write_patients" on patients for all using (true) with check (true);
create policy "demo_read_write_appointments" on appointments for all using (true) with check (true);
create policy "demo_read_write_threads" on whatsapp_threads for all using (true) with check (true);
create policy "demo_read_write_messages" on whatsapp_messages for all using (true) with check (true);
