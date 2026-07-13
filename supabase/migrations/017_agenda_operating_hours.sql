-- v3: horários de funcionamento (clínica + dentista)

create table clinic_operating_hours (
  clinic_id uuid not null references clinics(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_open boolean not null default false,
  opens_at time,
  closes_at time,
  primary key (clinic_id, day_of_week),
  check (
    (not is_open and opens_at is null and closes_at is null)
    or (is_open and opens_at is not null and closes_at is not null and opens_at < closes_at)
  )
);

create table dentist_operating_hours (
  dentist_id uuid not null references dentists(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_open boolean not null default false,
  opens_at time,
  closes_at time,
  primary key (dentist_id, day_of_week),
  check (
    (not is_open and opens_at is null and closes_at is null)
    or (is_open and opens_at is not null and closes_at is not null and opens_at < closes_at)
  )
);

create index idx_dentist_operating_hours_clinic
  on dentist_operating_hours(clinic_id, dentist_id);

alter table clinic_operating_hours enable row level security;
alter table dentist_operating_hours enable row level security;

create policy "clinic_operating_hours_clinic" on clinic_operating_hours for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

create policy "dentist_operating_hours_clinic" on dentist_operating_hours for all
  using (clinic_id = public.current_clinic_id() or public.is_super_admin())
  with check (clinic_id = public.current_clinic_id() or public.is_super_admin());

-- Smoke Test: seg–sex 08:00–18:00
insert into clinic_operating_hours (clinic_id, day_of_week, is_open, opens_at, closes_at)
select c.id, d.day_of_week, d.is_open, d.opens_at::time, d.closes_at::time
from clinics c
cross join (
  values
    (0, true, '08:00', '18:00'),
    (1, true, '08:00', '18:00'),
    (2, true, '08:00', '18:00'),
    (3, true, '08:00', '18:00'),
    (4, true, '08:00', '18:00'),
    (5, false, null, null),
    (6, false, null, null)
) as d(day_of_week, is_open, opens_at, closes_at)
where c.name ilike '%smoke test%'
on conflict (clinic_id, day_of_week) do nothing;

-- Horários padrão dos dentistas = horário da clínica (seg–sex)
insert into dentist_operating_hours (dentist_id, clinic_id, day_of_week, is_open, opens_at, closes_at)
select d.id, d.clinic_id, h.day_of_week, h.is_open, h.opens_at, h.closes_at
from dentists d
join clinic_operating_hours h on h.clinic_id = d.clinic_id
join clinics c on c.id = d.clinic_id
where c.name ilike '%smoke test%'
on conflict (dentist_id, day_of_week) do nothing;
