-- v2: registro de aceite dos termos no cadastro

alter table profiles
  add column if not exists terms_accepted_at timestamptz;
