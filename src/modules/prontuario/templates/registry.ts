import { atestadoTemplate } from "./atestado";
import { guiaTemplate } from "./guia";
import { receitaTemplate } from "./receita";
import type { ClinicalDocumentTemplate, ClinicalTemplateDefinition } from "./types";

export const TEMPLATE_MAP: Record<
  ClinicalDocumentTemplate,
  ClinicalTemplateDefinition
> = {
  receita: receitaTemplate,
  atestado: atestadoTemplate,
  guia: guiaTemplate,
};
