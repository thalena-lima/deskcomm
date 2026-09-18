/**
 * afb_comercial_v1 — Etapa 8: a cadência de follow-up, ciclo de 15 dias.
 *
 * ⚠️ ESTA É A CADÊNCIA OFICIAL (v6): D0 · D1 · D3 · D5 · D8 · D12 · D15, com
 * TRÊS follow-ups. Não confundir com a versão anterior codificada em
 * `lib/afb/playbook/cadencia.ts` (D6/D9/D16/D20, quatro follow-ups) — aquela
 * está em conflito com este documento e é sinalizada, não alterada aqui.
 */
import type { Cadencia } from "../types";

export const CADENCIA: Cadencia = {
  titulo: "Cadência de follow-up",
  objetivo:
    "Para quem não respondeu ou parou de responder no meio da conversa. Cada follow-up traz um tema novo, nunca uma cobrança de resposta.",
  cicloDias: 15,
  respostaInterrompe: true,
  aoResponder:
    "Se o prospect responder em qualquer ponto, ele sai da cadência e a conversa retoma nas Etapas 2 a 6.",
  reciclagemMeses: 6,
  // "Horários: 8h30 às 11h ou 14h às 17h. Nunca depois das 18h, nunca fim de
  // semana. Segunda de manhã e sexta à tarde são os piores períodos para
  // decisor industrial." — a mesma regra que está em `regras`, agora em forma
  // que o motor avalia (`janelaDoToque`).
  janela: {
    faixas: [
      { inicioMin: 8 * 60 + 30, fimMin: 11 * 60 },
      { inicioMin: 14 * 60, fimMin: 17 * 60 },
    ],
    diasPermitidos: [1, 2, 3, 4, 5],
    desaconselhados: [
      { diaDaSemana: 1, periodo: "manha" },
      { diaDaSemana: 5, periodo: "tarde" },
    ],
    inicioDaTardeMin: 12 * 60,
  },
  toques: [
    {
      id: "followup.d0.abordagem",
      dia: 0,
      rotulo: "Abordagem inicial",
      canal: "whatsapp_e_email",
      tema: "Etapa 1",
      remeteA: "whatsapp.abertura",
    },
    {
      id: "followup.d1.ligacao_1",
      dia: 1,
      rotulo: "Ligação 1",
      canal: "telefone",
      tema: "Roteiro de ligação, período da manhã",
      periodo: "manha",
      remeteA: "ligacao",
    },
    {
      id: "followup.d3.demanda_contratada",
      dia: 3,
      rotulo: "Follow-up 1",
      canal: "whatsapp_e_email",
      tema: "Demanda contratada",
      anexo: "case_png",
      mensagem: {
        id: "followup.d3.demanda_contratada.mensagem",
        canal: "whatsapp",
        texto: `Um dos principais pontos que analisamos é a demanda contratada.

Quando ela está acima do necessário, a empresa paga por uma capacidade que não utiliza. Quando está abaixo, pode haver cobrança adicional por ultrapassagem.

Com o histórico da própria fatura, conseguimos comparar o contratado com o utilizado e identificar possíveis distorções.

Se você me enviar uma fatura, eu consigo verificar esse ponto para você.

[INSERIR CASE DE ECONOMIA — PNG]`,
        nota: "É o follow-up mais forte da cadência, por isso abre. Descreve um custo verificável, dá o critério de verificação e faz um pedido pequeno. É o único dos três que já pede a fatura.",
      },
    },
    {
      id: "followup.d5.ligacao_2",
      dia: 5,
      rotulo: "Ligação 2",
      canal: "telefone",
      tema: "Roteiro de ligação, período da tarde",
      periodo: "tarde",
      remeteA: "ligacao",
    },
    {
      id: "followup.d8.energia_reativa",
      dia: 8,
      rotulo: "Follow-up 2",
      canal: "whatsapp_e_email",
      tema: "Energia reativa",
      anexo: "case_png",
      mensagem: {
        id: "followup.d8.energia_reativa.mensagem",
        canal: "whatsapp",
        texto: `Existe um custo na fatura que muitas empresas acabam pagando sem perceber: a energia reativa. Normalmente aparece na fatura como "Energia Reativa" - "Multa por Energia Reativa".

Com ajustes na instalação essa multa pode ser completamente eliminada

Você sabe se esse custo aparece hoje na fatura?

[INSERIR CASE DE ECONOMIA — PNG]`,
        nota: "Nomeia o item exatamente como ele aparece na conta, o que transforma a mensagem em tarefa verificável: o prospect consegue abrir a fatura e conferir em trinta segundos. Quem confere e encontra, responde.",
      },
    },
    {
      id: "followup.d12.contratacao_livre",
      dia: 12,
      rotulo: "Follow-up 3",
      canal: "email",
      tema: "Ambiente de Contratação Livre",
      anexo: "case_png",
      mensagem: {
        id: "followup.d12.contratacao_livre.mensagem",
        canal: "email",
        texto: `Outro ponto que analisamos: o preço da energia também pode representar uma oportunidade de economia.

Para empresas elegíveis, essa parcela pode ser contratada no Mercado Livre de Energia, permitindo comparar condições entre diferentes comercializadoras e com isso contratar a energia mais barata.

A distribuidora continua responsável pela rede, manutenção e atendimento. O que muda é a forma de contratação da energia.

[INSERIR CASE DE ECONOMIA — PNG]`,
        nota: '"Para empresas elegíveis" não é detalhe burocrático. É o que impede a promessa de mercado livre para quem não tem perfil — e o que permite dizer depois, sem constrangimento, que no caso dele não se aplica.',
      },
    },
    {
      id: "followup.d15.encerramento",
      dia: 15,
      rotulo: "Encerramento",
      canal: "whatsapp_e_email",
      tema: "Despedida",
      mensagem: {
        id: "followup.d15.encerramento.mensagem",
        canal: "whatsapp",
        texto: `Vou encerrar meu contato por aqui para não ser inconveniente.

Só deixo um último ponto: enquadramento tarifário, energia reativa, demanda contratada e preço da energia são custos que podem passar anos sem revisão.

Quando existe uma oportunidade de ajuste, a economia também deixa de acontecer mês após mês.

Se em algum momento fizer sentido revisar isso na [Empresa], fico à disposição.

Obrigado pelo seu tempo.`,
        nota: 'Não reabra a negociação aqui. A força desta mensagem está em não pedir nada. Vendedor que emenda "consegue 15 minutos ainda essa semana?" no fim anula o efeito e vira o incômodo que a primeira linha diz que não quer ser.',
      },
    },
  ],
  regras: [
    "Resposta encerra a cadência. Qualquer retorno tira o prospect da fila de follow-up e devolve para a conversa das Etapas 2 a 6.",
    "As duas ligações são em períodos diferentes. Manhã na primeira, tarde na segunda. Repetir o horário é testar o mesmo cenário duas vezes.",
    '"Não temos interesse" encerra na hora, com a pergunta de saída da biblioteca de objeções. Não se envia o restante da cadência.',
    "Cada case em PNG é anexado à mensagem correspondente. Follow-up sem o case perde a prova, mas ainda funciona — nunca invente número para preencher.",
    "Depois do D15, o lead vai para reciclagem em 6 meses. Não existe oitavo toque.",
    "Horários: 8h30 às 11h ou 14h às 17h. Nunca depois das 18h, nunca fim de semana. Segunda de manhã e sexta à tarde são os piores períodos para decisor industrial.",
  ],
  regraDosCases:
    "Use apenas casos reais já executados, sem nome do cliente, sem logotipo e sem documento identificável. O marcador [INSERIR CASE DE ECONOMIA — PNG] indica onde a imagem entra.",
};
