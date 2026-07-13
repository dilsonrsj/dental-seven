-- Link de indicação legível por founding member

alter table beta_founders
  add column if not exists ref_slug text;

create unique index if not exists beta_founders_ref_slug_unique
  on beta_founders (ref_slug)
  where ref_slug is not null;

comment on column beta_founders.ref_slug is 'Slug único para /founding?ref= — link pessoal de indicação';
