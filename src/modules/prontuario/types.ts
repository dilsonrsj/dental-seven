export type PatientDocumentSource = "imported" | "generated" | "clinical";

export type PatientDocument = {
  id: string;
  clinic_id: string;
  patient_id: string;
  title: string;
  mime_type: string;
  storage_path: string;
  file_size_bytes: number;
  source: PatientDocumentSource;
  uploaded_by: string | null;
  created_at: string;
};

export type PatientDocumentListItem = PatientDocument & {
  uploader_name: string | null;
};

export type PatientClinicalNote = {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id: string | null;
  author_id: string | null;
  body: string;
  created_at: string;
};

export type PatientClinicalNoteListItem = PatientClinicalNote & {
  author_name: string | null;
  appointment_label: string | null;
};

export type PatientToothRecord = {
  id: string;
  clinic_id: string;
  patient_id: string;
  tooth_number: number;
  status: string;
  faces: string[];
  note: string | null;
  updated_by: string | null;
  updated_at: string;
};

export type PatientToothRecordListItem = PatientToothRecord;
