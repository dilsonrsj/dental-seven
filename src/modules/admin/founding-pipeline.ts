export type FoundingStage =
  | "submitted"
  | "accessed"
  | "signed_up"
  | "active";

export type FoundingPipelineInput = {
  accessed_at: string | null;
  signup_completed_at: string | null;
  clinic_id: string | null;
  patient_count: number;
  appointment_count: number;
};

export function getFoundingStage(founder: FoundingPipelineInput): FoundingStage {
  if (
    founder.clinic_id &&
    (founder.patient_count > 0 || founder.appointment_count > 0)
  ) {
    return "active";
  }

  if (founder.signup_completed_at || founder.clinic_id) {
    return "signed_up";
  }

  if (founder.accessed_at) {
    return "accessed";
  }

  return "submitted";
}

export function foundingStageLabel(stage: FoundingStage): string {
  switch (stage) {
    case "submitted":
      return "Formulário enviado";
    case "accessed":
      return "Cadastro acessado";
    case "signed_up":
      return "Clínica criada";
    case "active":
      return "Ativo na beta";
  }
}
