/**
 * A cadência de follow-up — o calendário de 20 dias do playbook.
 *
 * É um estado PARALELO ao funil e à sequência: quem está em Prospecção ou em
 * Conversa e parou de responder entra na cadência; qualquer resposta tira o
 * lead dela e a conversa retoma nas etapas 2 a 6. Por isso ela não é coluna
 * nem etapa da sequência — tem calendário próprio, e é dele que saem os
 * campos que hoje o atendente preenche à mão:
 *
 *   `dia_cadencia`      = dias corridos desde o início da cadência  (calculado)
 *   `proximo_followup`  = data do próximo toque do calendário       (calculado)
 *
 * Os dois precisam de UMA âncora: a data em que a cadência começou (D0 = a
 * abordagem inicial). É a única coisa que precisa estar gravada.
 */

export const TOQUES_IDS = [
  "abordagem",
  "ligacao_1",
  "follow_up_1",
  "ligacao_2",
  "follow_up_2",
  "follow_up_3",
  "follow_up_4",
  "encerramento",
] as const;
export type ToqueId = (typeof TOQUES_IDS)[number];

export type CanalDoToque = "whatsapp_ou_email" | "telefone" | "email" | "whatsapp";

export interface ToqueDaCadencia {
  id: ToqueId;
  /** D0..D20 — dias corridos desde o início. */
  dia: number;
  canal: CanalDoToque;
  /** O tema do toque — cada follow-up ensina algo novo, nunca cobra resposta. */
  tema: string;
  /** Período do dia, quando o playbook fixa um (as duas ligações alternam). */
  periodo?: "manha" | "tarde";
  /** Tem mensagem de WhatsApp pronta (as ligações e o e-mail do D16 não têm). */
  temMensagemDeWhatsapp: boolean;
}

export const CADENCIA_DE_FOLLOW_UP: readonly ToqueDaCadencia[] = [
  { id: "abordagem", dia: 0, canal: "whatsapp_ou_email", tema: "Abertura", temMensagemDeWhatsapp: true },
  { id: "ligacao_1", dia: 1, canal: "telefone", tema: "Roteiro de ligação", periodo: "manha", temMensagemDeWhatsapp: false },
  { id: "follow_up_1", dia: 3, canal: "whatsapp_ou_email", tema: "Modalidade tarifária", temMensagemDeWhatsapp: true },
  { id: "ligacao_2", dia: 6, canal: "telefone", tema: "Roteiro de ligação", periodo: "tarde", temMensagemDeWhatsapp: false },
  { id: "follow_up_2", dia: 9, canal: "whatsapp_ou_email", tema: "Energia reativa", temMensagemDeWhatsapp: true },
  { id: "follow_up_3", dia: 12, canal: "whatsapp_ou_email", tema: "Demanda contratada", temMensagemDeWhatsapp: true },
  { id: "follow_up_4", dia: 16, canal: "email", tema: "Ambiente de Contratação Livre", temMensagemDeWhatsapp: false },
  { id: "encerramento", dia: 20, canal: "whatsapp", tema: "Despedida", temMensagemDeWhatsapp: true },
];

/** Depois do D20 não há nono toque: o lead vai para reciclagem. */
export const ULTIMO_DIA_DA_CADENCIA = 20;
export const MESES_ATE_RECICLAR = 6;

const MS_POR_DIA = 86_400_000;

/**
 * Dias corridos desde o início da cadência, em dias CIVIS (meia-noite a
 * meia-noite), nunca negativo. Uma abordagem às 17h e a consulta às 9h do dia
 * seguinte é D1 — o calendário do playbook conta dias, não intervalos de 24h.
 */
export function diaDaCadencia(inicio: Date, agora: Date): number {
  const i = Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), inicio.getUTCDate());
  const a = Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate());
  return Math.max(0, Math.floor((a - i) / MS_POR_DIA));
}

/**
 * O próximo toque a partir de um dia da cadência — o toque do PRÓPRIO dia
 * conta como "próximo" (D3 devolve o follow-up 1, que é o de hoje). `null`
 * depois do D20: a cadência acabou.
 */
export function proximoToque(dia: number): ToqueDaCadencia | null {
  if (dia < 0) return CADENCIA_DE_FOLLOW_UP[0]!;
  return CADENCIA_DE_FOLLOW_UP.find((t) => t.dia >= dia) ?? null;
}

/** Os toques cujo dia já passou ou é hoje — o que deveria ter saído até agora. */
export function toquesVencidos(dia: number): readonly ToqueDaCadencia[] {
  return CADENCIA_DE_FOLLOW_UP.filter((t) => t.dia <= dia);
}

/** A data civil (UTC) de um toque, dada a âncora. */
export function dataDoToque(inicio: Date, toque: ToqueDaCadencia): Date {
  const base = Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), inicio.getUTCDate());
  return new Date(base + toque.dia * MS_POR_DIA);
}

export function cadenciaEncerrada(dia: number): boolean {
  return dia > ULTIMO_DIA_DA_CADENCIA;
}

/**
 * Horários em que um toque pode sair: 8h30–11h ou 14h–17h, nunca depois das
 * 18h, nunca fim de semana. Segunda de manhã e sexta à tarde são os piores
 * períodos para decisor industrial — o playbook desaconselha, e aqui isso
 * vira `desaconselhado`, não proibido: quem decide é o atendente.
 *
 * Recebe hora/minuto/dia-da-semana já no fuso do atendente — este arquivo não
 * sabe de fuso, e não deve: a conversão é de quem tem o relógio.
 */
export function janelaDoToque(
  diaDaSemana: number,
  hora: number,
  minuto: number,
): "permitido" | "desaconselhado" | "fora_da_janela" {
  const fimDeSemana = diaDaSemana === 0 || diaDaSemana === 6;
  if (fimDeSemana) return "fora_da_janela";
  const minutos = hora * 60 + minuto;
  const manha = minutos >= 8 * 60 + 30 && minutos < 11 * 60;
  const tarde = minutos >= 14 * 60 && minutos < 17 * 60;
  if (!manha && !tarde) return "fora_da_janela";
  if (diaDaSemana === 1 && manha) return "desaconselhado";
  if (diaDaSemana === 5 && tarde) return "desaconselhado";
  return "permitido";
}
