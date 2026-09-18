/**
 * afb_comercial_v1 — métricas de controle e o que ainda está em desenvolvimento.
 */
import type { Metrica } from "../types";

export const METRICAS: readonly Metrica[] = [
  {
    indicador: "Taxa de resposta",
    comoMedir: "Respostas ÷ leads contatados",
    quandoBaixo: "A Etapa 1 está errada, ou a lista está errada",
  },
  {
    indicador: "Avanço na sequência",
    comoMedir: "Leads que chegaram à Etapa 5 ÷ leads que responderam",
    quandoBaixo: "Alguma etapa do meio está perdendo gente — verificar qual",
  },
  {
    indicador: "Taxa de agendamento",
    comoMedir: "Reuniões marcadas ÷ leads que responderam",
    quandoBaixo: "O convite está fraco ou o vendedor não fecha horário",
  },
  {
    indicador: "Captação da fatura",
    comoMedir: "Faturas recebidas ÷ reuniões marcadas",
    quandoBaixo: "A mensagem de confirmação não está sendo enviada",
  },
  {
    indicador: "Comparecimento",
    comoMedir: "Reuniões realizadas ÷ marcadas",
    quandoBaixo: "Falta o lembrete de 24h, ou o agendamento está longe demais da data do sim",
  },
];

/**
 * Preservada como está no documento. Note que ela fala em "variação da Etapa
 * 1" enquanto a v6 tem uma copy única no WhatsApp — a nota provavelmente
 * sobreviveu de uma versão anterior; não cabe a este código corrigi-la.
 */
export const NOTAS_DE_METRICAS: readonly string[] = [
  "Cada vendedor registra estes cinco números por semana. Sem isso não é possível saber qual variação funciona.",
  "Teste controlado: cada vendedor usa uma única variação da Etapa 1 por semana, com no mínimo 30 envios, antes de trocar. Alternar variações dentro do mesmo lote impede qualquer leitura de resultado.",
];

export const EM_DESENVOLVIMENTO: readonly string[] = [
  "Critério de qualificação. Quais empresas entram no funil: porte mínimo de fatura, perfil de operação e região.",
  "Reordenação da apresentação comercial. Ajuste da sequência de slides da reunião de 30 minutos.",
];
