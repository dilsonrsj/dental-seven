-- v3.5+: contatos da clínica no rodapé dos documentos clínicos (PDF)

alter table clinics
  add column if not exists contact_whatsapp text,
  add column if not exists contact_instagram text,
  add column if not exists contact_email text,
  add column if not exists contact_address text;

update clinics
set
  contact_whatsapp = '(11) 98765-4321',
  contact_instagram = '@clinica.smoketest',
  contact_email = 'contato@clinica-smoketest.com.br',
  contact_address = 'Av. Paulista, 1000 — Sala 42 — São Paulo/SP — CEP 01310-100'
where name ilike '%smoke test%'
  and contact_whatsapp is null;
