const ACTION_LABELS: Record<string, string> = {
  "clinic.plan_changed": "Plano alterado",
  "clinic.trial_extended": "Trial estendido",
  "clinic.suspended": "Clínica suspensa",
  "clinic.reactivated": "Clínica reativada",
  "clinic.module_toggled": "Módulo alterado",
  "clinic.export_requested": "Export LGPD solicitado",
  "clinic.notes_updated": "Notas internas atualizadas",
  "clinic.provisioned": "Clínica provisionada",
  "clinic.impersonation_started": "Impersonação iniciada",
  "clinic.impersonation_stopped": "Impersonação encerrada",
  "clinic.whatsapp_throttle_set": "WhatsApp throttle alterado",
  "fair_use.email_sent": "E-mail fair use enviado",
  "dentist.invited": "Dentista convidado",
  "dentist.extra_added": "Dentista extra adicionado (+R$ 20/mês)",
  "founder.feedback_status_updated": "Feedback founding atualizado",
};

export function adminAuditActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}
