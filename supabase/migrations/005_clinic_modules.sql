-- v2: pluggable modules per clinic
create table clinic_modules (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  module_key text not null,
  enabled boolean not null default true,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (clinic_id, module_key)
);

create index idx_clinic_modules_clinic on clinic_modules(clinic_id);

alter table clinic_modules enable row level security;

-- seed demo clinic modules (conecta tier for dev)
insert into clinic_modules (clinic_id, module_key, enabled) values
  ('11111111-1111-1111-1111-111111111111', 'agenda', true),
  ('11111111-1111-1111-1111-111111111111', 'pacientes', true),
  ('11111111-1111-1111-1111-111111111111', 'whatsapp', true)
on conflict (clinic_id, module_key) do nothing;
