/**
 * afb_comercial_v1 — o playbook montado.
 *
 * Fonte de verdade: Playbook Comercial — Consultoria em Energia, Versão 6
 * (docs/afb/playbooks/afb-comercial-v1.html). Copy editada aqui e só aqui; nenhum
 * componente carrega texto.
 */
import type { Playbook } from "../types";

import { FONTE, ID, META, NOME, PLACEHOLDERS, PRINCIPIOS, VERSAO_DO_DOCUMENTO } from "./config";
import { EMAIL } from "./email";
import { CADENCIA } from "./followups";
import { GUARDRAILS } from "./guardrails";
import { LIGACAO } from "./ligacao";
import { EM_DESENVOLVIMENTO, METRICAS, NOTAS_DE_METRICAS } from "./metricas";
import { OBJECOES } from "./objecoes";
import { POS_SIM } from "./reuniao";
import { ETAPAS_WHATSAPP } from "./whatsapp";

export const AFB_COMERCIAL_V1: Playbook = {
  id: ID,
  nome: NOME,
  versaoDoDocumento: VERSAO_DO_DOCUMENTO,
  fonte: FONTE,
  meta: META,
  principios: PRINCIPIOS,
  placeholders: PLACEHOLDERS,
  whatsapp: { etapas: ETAPAS_WHATSAPP, posSim: POS_SIM },
  followup: CADENCIA,
  email: EMAIL,
  ligacao: LIGACAO,
  objecoes: OBJECOES,
  guardrails: GUARDRAILS,
  metricas: METRICAS,
  notasDeMetricas: NOTAS_DE_METRICAS,
  emDesenvolvimento: EM_DESENVOLVIMENTO,
};
