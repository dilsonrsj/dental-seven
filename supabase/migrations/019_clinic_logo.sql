-- v2 pré-beta: logo da clínica no header e PDFs

alter table clinics
  add column if not exists logo_storage_path text;
