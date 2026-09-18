/**
 * O PAPEL que uma coluna do funil desempenha para o playbook.
 *
 * É a peça que separa o funil do playbook sem amarrar nenhum dos dois ao nome
 * da coluna. "Sem Contato", "Contato Feito", "Pré-venda – ligação" são nomes
 * que o dono da AFB pode renomear amanhã — e o funil "Prospecção AFB" vai ter
 * colunas diferentes. O que NÃO muda é o vocabulário de papéis abaixo: toda
 * coluna de qualquer funil AFB é uma destas coisas, e a configuração do funil
 * (`mapeamento.ts`) diz qual coluna é qual.
 *
 * Cada papel declara as etapas do playbook que cabem NELE. Uma coluna pode
 * abrigar várias (Contato Feito = qualificação → convite); outra pode não
 * abrigar nenhuma (apresentação, fechamento: reunião, não WhatsApp). O
 * follow-up é permitido por papel porque ele corre em paralelo: quem está em
 * Sem Contato ou Contato Feito pode estar em cadência; quem já tem reunião
 * marcada, não.
 */
import { ehPapelConfiguravelDaEtapaDoFunil, ehPapelDaEtapaDoFunil } from "@/lib/pipelines/modulos";
import {
  PAPEIS_CONFIGURAVEIS_DA_ETAPA_DO_FUNIL,
  PAPEIS_DE_ETAPA_DO_FUNIL,
  PAPEIS_TERMINAIS_DA_ETAPA_DO_FUNIL,
  type PapelConfiguravelDaEtapaDoFunil,
  type PapelDaEtapaDoFunil,
} from "@/lib/schemas/settings";

import type { EtapaId } from "./etapas";

/**
 * O vocabulário é do CORE (`lib/schemas/settings.ts`): é o que o schema de
 * escrita aceita, então é o que a leitura reconhece. Papel novo nasce lá; aqui
 * ele ganha as etapas que abriga.
 *
 * Dois conjuntos: os CONFIGURÁVEIS (o administrador escolhe no mapa) e os
 * TERMINAIS (`ganho`/`perdido`, que só `is_won`/`is_lost` produzem). A
 * resolução de uma coluna pode devolver qualquer um dos nove.
 */
export const PAPEIS_IDS = PAPEIS_DE_ETAPA_DO_FUNIL;
export type PapelId = PapelDaEtapaDoFunil;
export const PAPEIS_CONFIGURAVEIS = PAPEIS_CONFIGURAVEIS_DA_ETAPA_DO_FUNIL;
export type PapelConfiguravelId = PapelConfiguravelDaEtapaDoFunil;
export const PAPEIS_TERMINAIS = PAPEIS_TERMINAIS_DA_ETAPA_DO_FUNIL;

export interface PapelDaEtapa {
  id: PapelId;
  titulo: string;
  /** Uma frase para quem configura o funil entender o que está escolhendo. */
  descricao: string;
  /** Etapas do playbook que cabem numa coluna com este papel, na ordem. */
  etapas: readonly EtapaId[];
  /** A cadência de follow-up pode estar correndo enquanto o lead está aqui. */
  followUpPermitido: boolean;
  /**
   * Estado final do CRM. `ganho` e `perdido` vêm de `crm_stages.is_won` /
   * `is_lost` e SÓ de lá: o schema de escrita não os aceita no mapa e a
   * leitura os descarta se aparecerem — ver `papelDaEtapaDoFunil`.
   */
  terminal: boolean;
}

export const PAPEIS_DE_ETAPA: readonly PapelDaEtapa[] = [
  {
    id: "prospeccao",
    titulo: "Prospecção",
    descricao: "Ninguém respondeu ainda. Abertura e, se silenciar, a cadência de follow-up.",
    etapas: ["abertura"],
    followUpPermitido: true,
    terminal: false,
  },
  {
    id: "conversa",
    titulo: "Conversa em andamento",
    descricao: "O cliente respondeu. Da qualificação ao convite, uma resposta por vez.",
    etapas: ["qualificacao", "gancho_de_valor", "desarme_de_risco", "micro_spin", "convite"],
    followUpPermitido: true,
    terminal: false,
  },
  {
    id: "pre_venda",
    titulo: "Pré-venda por telefone",
    descricao: "A ligação assume a conversa; pelo WhatsApp só o convite e a cadência.",
    etapas: ["convite"],
    followUpPermitido: true,
    terminal: false,
  },
  {
    id: "reuniao_agendada",
    titulo: "Reunião agendada",
    descricao: "Sim dado. Confirmar, captar a fatura e lembrar 24h antes.",
    etapas: ["pos_sim"],
    followUpPermitido: false,
    terminal: false,
  },
  {
    id: "apresentacao",
    titulo: "Apresentação",
    descricao: "A conversa acontece na reunião, não no WhatsApp. Sem mensagem do playbook.",
    etapas: [],
    followUpPermitido: false,
    terminal: false,
  },
  {
    id: "fechamento",
    titulo: "Fechamento",
    descricao: "Proposta e decisão. Sem mensagem do playbook de prospecção.",
    etapas: [],
    followUpPermitido: false,
    terminal: false,
  },
  {
    id: "pos_venda",
    titulo: "Pós-venda",
    descricao: "Cliente fechado. O playbook de prospecção não se aplica.",
    etapas: [],
    followUpPermitido: false,
    terminal: false,
  },
  {
    id: "ganho",
    titulo: "Ganho",
    descricao: "Estado final do CRM — lido da marcação «ganho» da etapa.",
    etapas: [],
    followUpPermitido: false,
    terminal: true,
  },
  {
    id: "perdido",
    titulo: "Perdido",
    descricao: "Estado final do CRM — lido da marcação «perdido» da etapa.",
    etapas: [],
    followUpPermitido: false,
    terminal: true,
  },
];

const POR_ID: ReadonlyMap<PapelId, PapelDaEtapa> = new Map(PAPEIS_DE_ETAPA.map((p) => [p.id, p]));

export function papel(id: PapelId): PapelDaEtapa {
  return POR_ID.get(id)!;
}

/** Aceita valor cru e devolve o papel só se for um dos NOVE (o que a resolução devolve). */
export const ehPapelId: (valor: unknown) => valor is PapelId = ehPapelDaEtapaDoFunil;

/** Aceita valor cru (jsonb) e devolve o papel só se for um dos SETE que o mapa aceita. */
export const ehPapelConfiguravel: (valor: unknown) => valor is PapelConfiguravelId =
  ehPapelConfiguravelDaEtapaDoFunil;
