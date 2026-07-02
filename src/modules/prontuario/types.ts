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
