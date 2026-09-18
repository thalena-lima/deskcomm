/**
 * afb_comercial_v1 — Etapa 7: depois do sim (confirmação, fatura, lembrete)
 * e a condução da primeira reunião.
 */
import type { EtapaPosSim } from "../types";

export const POS_SIM: EtapaPosSim = {
  id: "pos_sim",
  ordem: 7,
  titulo: "Confirmação e captação da fatura",
  objetivo:
    "Etapa que mais muda a conversão da reunião. Com a fatura em mãos, a reunião deixa de ser explicação de método e passa a ser sobre a empresa dele.",
  confirmacao: {
    id: "pos_sim.confirmacao",
    canal: "whatsapp",
    texto: `Fechado.. Agendado para [dia], às [hora]. Reservei 30 minutos. [Link ou endereço].

Para eu preparar o relatório que combinamos, preciso de uma fatura de energia recente, em foto ou PDF. A conta já traz o histórico de doze meses, então uma fatura basta.

Com ela em mãos eu chego na reunião com os números da sua empresa.

Se não der para enviar, tudo bem — a gente conversa do mesmo jeito.`,
    nota: "Imediatamente após o sim.",
  },
  lembrete24h: {
    id: "pos_sim.lembrete_24h",
    canal: "whatsapp",
    texto: `Olá, [Nome]! Só confirmando nosso horário de amanhã, às [hora].

Esse horário ficou reservado para nossa análise da [Empresa]. Se estiver tudo certo, me confirma por aqui para eu manter na agenda.`,
    nota: "Lembrete, 24 horas antes.",
  },
  lembreteSemFatura:
    'Se a fatura ainda não chegou, acrescente uma linha: "Se conseguir me mandar a fatura ainda hoje, eu chego com sua análise pronta." Não envie como mensagem separada.',
  aberturaComFatura: {
    id: "pos_sim.abertura_com_fatura",
    canal: "whatsapp",
    texto: `[Nome], antes de começar: eu olhei a fatura que você mandou.

Sua demanda contratada é [X] kW. No histórico dos últimos 12 meses, o maior valor que vocês usaram foi [Y] kW. Ou seja, tem uma diferença sendo faturada todo mês sem contrapartida de consumo.

Esse é um dos três pontos que eu encontrei. Deixa eu te mostrar como a análise funciona e no fim a gente combina o levantamento completo.`,
    nota: "Abertura da primeira reunião com a fatura em mãos — falada, não enviada.",
  },
  conducaoDaReuniao: [
    {
      cenario: "A fatura chegou",
      comoAbrir: "Abrir com um único achado da conta dele, nos dois primeiros minutos. Depois seguir a apresentação normalmente.",
      oQueNaoFazer: "Não apresentar o relatório completo nem o consolidado de economia. Isso é da reunião de fechamento.",
    },
    {
      cenario: "A fatura não chegou",
      comoAbrir: "Seguir a apresentação padrão e usar as perguntas de diagnóstico para o cliente falar da operação dele.",
      oQueNaoFazer: "Não cobrar a fatura no início. Pedir no fim, como próximo passo acordado.",
    },
  ],
  regras: [
    "Regra do achado único: um achado na primeira reunião, o consolidado na segunda. A cotação com as comercializadoras depende de terceiros e não fica pronta em um dia — entregar tudo na reunião 1 destrói o momento de fechamento e não acelera nada.",
    "Apresentamos, não enviamos. O relatório é apresentado na segunda reunião e entregue ali.",
    "A fatura é pedida na Etapa 7, depois do sim à reunião. Nunca no primeiro contato.",
  ],
};
