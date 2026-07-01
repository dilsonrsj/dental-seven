-- v2: subscription and billing columns on clinics
alter table clinics
  add column if not exists subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'past_due', 'expired', 'canceled')),
  add column if not exists trial_ends_at timestamptz,
  add column if not exists plan_key text not null default 'essencial'
    check (plan_key in ('essencial', 'conecta', 'inteligente', 'completo')),
  add column if not exists asaas_customer_id text,
  add column if not exists asaas_subscription_id text,
  add column if not exists deleted_at timestamptz;

update clinics
set trial_ends_at = now() + interval '7 days'
where trial_ends_at is null;
