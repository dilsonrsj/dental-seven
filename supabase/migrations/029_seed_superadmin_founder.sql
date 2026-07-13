-- Seed SuperAdmin DR7 na lista Founding (mesmo fluxo “Já criei minha clínica”).
-- WhatsApp = canal operacional DR7 documentado no /founding.

insert into beta_founders (
  full_name,
  clinic_name,
  city,
  state,
  whatsapp,
  email,
  dentist_count,
  current_system,
  main_pain,
  accepted_terms,
  marketing_consent,
  founding_tier,
  ref_slug
)
select
  'DR7 SuperAdmin',
  'DR7 Performance',
  'Aracaju',
  'SE',
  '79998364822',
  'superadmin-smoke@dr7.app',
  '1',
  'interno',
  'Acesso operacional DR7 à beta',
  true,
  true,
  'founding_member',
  'dr7-superadmin-se'
where not exists (
  select 1 from beta_founders where lower(email) = lower('superadmin-smoke@dr7.app')
);
