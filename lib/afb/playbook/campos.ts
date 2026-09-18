/**
 * As chaves de `crm_leads.custom_fields` que o copiloto lê e grava — e o
 * ESTATUTO de cada uma. Constante compartilhada, nunca string literal nos
 * emissores (doutrina do vocabulário aberto, CLAUDE.md).
 *
 * `fonte`     — o copiloto lê e grava; ninguém deriva de outro lugar.
 * `calculado` — deriva de outra coisa; gravar é redundância que envelhece.
 *               Fica listado para o painel saber o que NÃO editar, e para a
 *               remoção futura ter uma lista.
 *
 * O que decide o estatuto é a doutrina DIRC: se dá para CALCULAR, não se
 * duplica. `dia_cadencia` e `proximo_followup` saem do calendário
 * (`cadencia.ts`) a partir de UMA âncora; `ultimo_contato` sai dos carimbos da
 * conversa. Gravá-los foi o que a planilha precisava; o sistema não precisa.
 */

export const CAMPOS_DO_COPILOTO = {
  /** Posição da conversa DENTRO da coluna — só o lead sabe (ver `posicaoNoPlaybook`). */
  etapa_playbook: "etapa_playbook",
  /** A/B/C escolhida — gravada porque é o que as métricas comparam. */
  variacao_abordagem: "variacao_abordagem",
  /** frio | decisor | tecnico — decide a variação sugerida. */
  perfil_interlocutor: "perfil_interlocutor",
  /** Estado paralelo da cadência: ativa | pausada | respondeu | encerrada. */
  status_followup: "status_followup",
  /** ÂNCORA da cadência (D0). Não existe no funil hoje — é o campo que falta. */
  inicio_cadencia: "inicio_cadencia",
  // ── calculados (lidos hoje por compatibilidade, não gravados pelo copiloto) ──
  dia_cadencia: "dia_cadencia",
  proximo_followup: "proximo_followup",
  ultimo_contato: "ultimo_contato",
} as const;
export type CampoDoCopiloto = keyof typeof CAMPOS_DO_COPILOTO;

export type EstatutoDoCampo = "fonte" | "calculado";

export const ESTATUTO_DOS_CAMPOS: Readonly<Record<CampoDoCopiloto, EstatutoDoCampo>> = {
  etapa_playbook: "fonte",
  variacao_abordagem: "fonte",
  perfil_interlocutor: "fonte",
  status_followup: "fonte",
  inicio_cadencia: "fonte",
  dia_cadencia: "calculado",
  proximo_followup: "calculado",
  ultimo_contato: "calculado",
};

/** Os campos que o copiloto pode GRAVAR. Tudo fora desta lista é só leitura. */
export const CAMPOS_GRAVAVEIS: readonly CampoDoCopiloto[] = (
  Object.keys(ESTATUTO_DOS_CAMPOS) as CampoDoCopiloto[]
).filter((c) => ESTATUTO_DOS_CAMPOS[c] === "fonte");

export const STATUS_DE_FOLLOW_UP = ["ativa", "pausada", "respondeu", "encerrada"] as const;
export type StatusDeFollowUp = (typeof STATUS_DE_FOLLOW_UP)[number];

export function ehStatusDeFollowUp(valor: unknown): valor is StatusDeFollowUp {
  return typeof valor === "string" && (STATUS_DE_FOLLOW_UP as readonly string[]).includes(valor);
}
