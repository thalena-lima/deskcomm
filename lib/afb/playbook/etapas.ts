/**
 * A RÉGUA das etapas de um playbook comercial — estrutura, não conteúdo.
 *
 * O funil (`crm_stages`) diz onde o NEGÓCIO está; a régua diz em que ponto da
 * CONVERSA o atendente está. Este arquivo só sabe QUAIS pontos existem, em que
 * ORDEM, e de que TIPO cada um é. Título, objetivo, copy, regra de espera,
 * instruções — tudo isso é do playbook selecionado (`lib/afb/playbooks/`) e
 * chega por `etapaDoPlaybookComercial(playbook, id)`. Este arquivo já
 * carregou título e objetivo de uma versão do playbook; virou segunda fonte de
 * verdade no dia em que o documento mudou.
 *
 * Os ids são a PONTE entre motor e conteúdo: `papeis.ts` diz quais cabem em
 * cada coluna, `mapeamento.ts` posiciona o lead, e o playbook identifica cada
 * copy de WhatsApp por um deles. Renomear um id quebra os três.
 */

/** Identificador estável de cada etapa — é o que `custom_fields.etapa_playbook` grava. */
export const ETAPAS_IDS = [
  "abertura",
  "qualificacao",
  "gancho_de_valor",
  "desarme_de_risco",
  "micro_spin",
  "convite",
  "pos_sim",
  "follow_up",
] as const;
export type EtapaId = (typeof ETAPAS_IDS)[number];

/**
 * `sequencia`  — as mensagens da conversa, uma resposta por vez (Etapas 1–6).
 * `pos_sim`    — depois do sim à reunião (Etapa 7).
 * `follow_up`  — estado PARALELO para quem parou de responder; não tem copy
 *                própria: o que ele tem é uma CADÊNCIA, e ela vem do playbook
 *                (`playbook.followup`), operada por `cadencia.ts`.
 */
export type TipoDeEtapa = "sequencia" | "pos_sim" | "follow_up";

export interface EtapaEstrutural {
  id: EtapaId;
  /** 1..8 — a ordem em que a régua as apresenta. */
  ordem: number;
  tipo: TipoDeEtapa;
}

export const ETAPAS_ESTRUTURAIS: readonly EtapaEstrutural[] = [
  { id: "abertura", ordem: 1, tipo: "sequencia" },
  { id: "qualificacao", ordem: 2, tipo: "sequencia" },
  { id: "gancho_de_valor", ordem: 3, tipo: "sequencia" },
  { id: "desarme_de_risco", ordem: 4, tipo: "sequencia" },
  { id: "micro_spin", ordem: 5, tipo: "sequencia" },
  { id: "convite", ordem: 6, tipo: "sequencia" },
  { id: "pos_sim", ordem: 7, tipo: "pos_sim" },
  { id: "follow_up", ordem: 8, tipo: "follow_up" },
];

/** Só os ids da SEQUÊNCIA, na ordem — o que um playbook precisa cobrir com copy de WhatsApp. */
export const SEQUENCIA_IDS: readonly EtapaId[] = ETAPAS_ESTRUTURAIS.filter(
  (e) => e.tipo === "sequencia",
).map((e) => e.id);

const POR_ID: ReadonlyMap<EtapaId, EtapaEstrutural> = new Map(
  ETAPAS_ESTRUTURAIS.map((e) => [e.id, e]),
);

export function etapaEstrutural(id: EtapaId): EtapaEstrutural {
  // Todo id do union está no array — o teste de consistência garante.
  return POR_ID.get(id)!;
}

/** Aceita valor cru (jsonb, string do custom field) e devolve o id só se for um. */
export function ehEtapaId(valor: unknown): valor is EtapaId {
  return typeof valor === "string" && (ETAPAS_IDS as readonly string[]).includes(valor);
}

export function ehEtapaDaSequencia(id: EtapaId): boolean {
  return etapaEstrutural(id).tipo === "sequencia";
}

/** A etapa seguinte da SEQUÊNCIA; `null` no fim dela ou fora dela. */
export function proximaEtapaDaSequencia(id: EtapaId): EtapaId | null {
  const i = SEQUENCIA_IDS.indexOf(id);
  if (i < 0) return null;
  return SEQUENCIA_IDS[i + 1] ?? null;
}

/** A etapa anterior da SEQUÊNCIA; `null` no início dela ou fora dela. */
export function etapaAnteriorDaSequencia(id: EtapaId): EtapaId | null {
  const i = SEQUENCIA_IDS.indexOf(id);
  if (i <= 0) return null;
  return SEQUENCIA_IDS[i - 1] ?? null;
}
