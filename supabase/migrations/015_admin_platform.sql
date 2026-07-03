-- v6: admin platform — usage, audit, notes

alter table clinics
  add column if not exists admin_notes text,
  add column if not exists whatsapp_throttled boolean not null default false;

create table clinic_usage_monthly (
  clinic_id uuid not null references clinics(id) on delete cascade,
  year_month text not null check (year_month ~ '^\d{4}-\d{2}$'),
  whatsapp_conversations integer not null default 0 check (whatsapp_conversations >= 0),
  ai_responses integer not null default 0 check (ai_responses >= 0),
  storage_bytes bigint not null default 0 check (storage_bytes >= 0),
  updated_at timestamptz not null default now(),
  primary key (clinic_id, year_month)
);

create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references profiles(id) on delete restrict,
  action text not null,
  clinic_id uuid references clinics(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table asaas_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  clinic_id uuid references clinics(id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index idx_clinic_usage_monthly_year on clinic_usage_monthly(year_month);
create index idx_admin_audit_log_created on admin_audit_log(created_at desc);
create index idx_admin_audit_log_clinic on admin_audit_log(clinic_id, created_at desc) where clinic_id is not null;
create index idx_asaas_webhook_events_clinic_created on asaas_webhook_events(clinic_id, created_at desc) where clinic_id is not null;

alter table clinic_usage_monthly enable row level security;
alter table admin_audit_log enable row level security;
alter table asaas_webhook_events enable row level security;

create policy "clinic_usage_monthly_super_admin" on clinic_usage_monthly for all
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy "admin_audit_log_super_admin" on admin_audit_log for all
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy "asaas_webhook_events_super_admin" on asaas_webhook_events for select
  using (public.is_super_admin());
