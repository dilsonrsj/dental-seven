"use client";

import { useState } from "react";
import type { PatientAppointmentWithRelations } from "@/modules/pacientes/types";
import { ClinicalDocumentForm } from "./clinical-document-form";
import { ClinicalNotes } from "./clinical-notes";
import { DocumentList } from "./document-list";
import type { PatientClinicalNoteListItem } from "./types";
import type { PatientDocumentListItem } from "./types";

type ProntuarioContentProps = {
  patientId: string;
  initialDocuments: PatientDocumentListItem[];
  initialNotes: PatientClinicalNoteListItem[];
  recentAppointments: PatientAppointmentWithRelations[];
  canWrite: boolean;
};

export function ProntuarioContent({
  patientId,
  initialDocuments,
  initialNotes,
  recentAppointments,
  canWrite,
}: ProntuarioContentProps) {
  const [documents, setDocuments] =
    useState<PatientDocumentListItem[]>(initialDocuments);

  return (
    <div className="space-y-6">
      <ClinicalNotes
        patientId={patientId}
        initialNotes={initialNotes}
        recentAppointments={recentAppointments}
        canWrite={canWrite}
      />
      <ClinicalDocumentForm
        patientId={patientId}
        canWrite={canWrite}
        onDocumentCreated={(document) =>
          setDocuments((current) => [document, ...current])
        }
      />
      <DocumentList
        patientId={patientId}
        initialDocuments={documents}
        onDocumentsChange={setDocuments}
      />
    </div>
  );
}
