-- revert v3.6 odontograma (implementação removida)

drop policy if exists "patient_tooth_records_clinic" on patient_tooth_records;
drop table if exists patient_tooth_records;
