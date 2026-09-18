/**
 * As etapas do Playbook Comercial AFB — a CONVERSA, não o funil.
 *
 * O funil (`crm_stages`) diz onde o NEGÓCIO está; o playbook diz em que ponto
 * da CONVERSA de WhatsApp o atendente está. As duas réguas não coincidem: uma
 * coluna do funil ("Contato Feito") abriga quatro etapas do playbook; três
 * colunas (apresentações, fechamento) não têm mensagem de WhatsApp nenhuma; e
 * o follow-up corre em paralelo a qualquer coluna, não é uma delas.
 *
 * Este arquivo é só a régua do playbook. Quem liga as duas réguas é
 * `mapeamento.ts`, via `papeis.ts`.
 *
 * Fonte: Playbook Comercial AFB v4 (documento interno da AFB).
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
 * `sequencia`  — as seis mensagens da conversa, uma resposta por vez.
 * `pos_sim`    — depois do sim à reunião: confirmação, fatura, lembrete.
 * `follow_up`  — estado PARALELO para quem parou de responder; tem calendário
 *                próprio (`cadencia.ts`) e volta à sequência ao primeiro retorno.
 */
export type TipoDeEtapa = "sequencia" | "pos_sim" | "follow_up";

export interface EtapaDoPlaybook {
  id: EtapaId;
  /** 1..8 — a ordem em que o playbook as apresenta. */
  ordem: number;
  tipo: TipoDeEtapa;
  titulo: string;
  /** O que a etapa precisa conseguir — uma frase, a do playbook. */
  objetivo: string;
  /** Tem mensagem de WhatsApp pronta para inserir no composer. */
  permiteMensagem: boolean;
  /**
   * Regra que não se quebra: a próxima mensagem da sequência só sai depois que
   * o cliente respondeu a esta. Falso apenas onde o próprio playbook manda
   * avançar sem resposta (Micro-SPIN → Convite após 24h) ou onde não há
   * sequência (pós-sim, follow-up).
   */
  exigeRespostaAntesDeAvancar: boolean;
  /** Trata de reunião (agendar, confirmar, preparar). */
  ehReuniao: boolean;
  ehFollowUp: boolean;
}

export const ETAPAS_DO_PLAYBOOK: readonly EtapaDoPlaybook[] = [
  {
    id: "abertura",
    ordem: 1,
    tipo: "sequencia",
    titulo: "Abertura",
    objetivo: "Comprar o direito de continuar falando. Não pede reunião.",
    permiteMensagem: true,
    exigeRespostaAntesDeAvancar: true,
    ehReuniao: false,
    ehFollowUp: false,
  },
  {
    id: "qualificacao",
    ordem: 2,
    tipo: "sequencia",
    titulo: "Qualificação",
    objetivo: "Uma pergunta só: alguém analisa a fatura ou apenas pagam?",
    permiteMensagem: true,
    exigeRespostaAntesDeAvancar: true,
    ehReuniao: false,
    ehFollowUp: false,
  },
  {
    id: "gancho_de_valor",
    ordem: 3,
    tipo: "sequencia",
    titulo: "Gancho de valor",
    objetivo: "O cliente perceber que existe algo na conta dele que nunca foi olhado.",
    permiteMensagem: true,
    exigeRespostaAntesDeAvancar: true,
    ehReuniao: false,
    ehFollowUp: false,
  },
  {
    id: "desarme_de_risco",
    ordem: 4,
    tipo: "sequencia",
    titulo: "Desarme de risco",
    objetivo: "Tirar o medo de obra, custo e mudança na operação antes de ele perguntar.",
    permiteMensagem: true,
    exigeRespostaAntesDeAvancar: true,
    ehReuniao: false,
    ehFollowUp: false,
  },
  {
    id: "micro_spin",
    ordem: 5,
    tipo: "sequencia",
    titulo: "Micro-SPIN",
    objetivo: "O cliente concluir sozinho que vale investigar. Enviar e esperar.",
    permiteMensagem: true,
    // O playbook manda ir ao convite se a resposta não vier em 24h — é a
    // única etapa da sequência em que avançar sem resposta é a regra, não a
    // exceção.
    exigeRespostaAntesDeAvancar: false,
    ehReuniao: false,
    ehFollowUp: false,
  },
  {
    id: "convite",
    ordem: 6,
    tipo: "sequencia",
    titulo: "Convite para a reunião",
    objetivo: "Transformar interesse em horário marcado, sempre com duas opções.",
    permiteMensagem: true,
    exigeRespostaAntesDeAvancar: true,
    ehReuniao: true,
    ehFollowUp: false,
  },
  {
    id: "pos_sim",
    ordem: 7,
    tipo: "pos_sim",
    titulo: "Pós-sim e fatura",
    objetivo: "Confirmar o horário e captar a fatura antes da reunião.",
    permiteMensagem: true,
    exigeRespostaAntesDeAvancar: false,
    ehReuniao: true,
    ehFollowUp: false,
  },
  {
    id: "follow_up",
    ordem: 8,
    tipo: "follow_up",
    titulo: "Follow-up",
    objetivo: "Um tema novo a cada toque, nunca cobrança de resposta.",
    permiteMensagem: true,
    exigeRespostaAntesDeAvancar: false,
    ehReuniao: false,
    ehFollowUp: true,
  },
];

const POR_ID: ReadonlyMap<EtapaId, EtapaDoPlaybook> = new Map(
  ETAPAS_DO_PLAYBOOK.map((e) => [e.id, e]),
);

export function etapaDoPlaybook(id: EtapaId): EtapaDoPlaybook {
  // Todo id do union está no array — o teste de consistência garante.
  return POR_ID.get(id)!;
}

/** Aceita valor cru (jsonb, string do custom field) e devolve o id só se for um. */
export function ehEtapaId(valor: unknown): valor is EtapaId {
  return typeof valor === "string" && (ETAPAS_IDS as readonly string[]).includes(valor);
}

/** A etapa seguinte da SEQUÊNCIA; `null` no fim dela ou fora dela. */
export function proximaEtapaDaSequencia(id: EtapaId): EtapaId | null {
  const atual = etapaDoPlaybook(id);
  if (atual.tipo !== "sequencia") return null;
  const seguinte = ETAPAS_DO_PLAYBOOK.find(
    (e) => e.tipo === "sequencia" && e.ordem === atual.ordem + 1,
  );
  return seguinte?.id ?? null;
}
