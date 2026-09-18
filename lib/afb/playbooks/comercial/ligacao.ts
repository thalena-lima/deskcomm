/**
 * afb_comercial_v1 — o roteiro de ligação (usado nos toques D1 e D5 da cadência).
 */
import type { RoteiroDeLigacao } from "../types";

export const LIGACAO: RoteiroDeLigacao = {
  descricao:
    "Usado quando o WhatsApp não foi respondido. Três momentos: recepção, abertura com o decisor e fechamento de agenda.",
  recepcao: {
    id: "ligacao.recepcao",
    canal: "telefone",
    texto: `Bom dia. Aqui é [Vendedor], da AFB Engenharia, consultoria de engenharia elétrica.

Queria falar com o responsável pela área de energia da empresa. Quem seria?`,
  },
  doQueSeTrata: {
    id: "ligacao.do_que_se_trata",
    canal: "telefone",
    texto: `Olá, [Nome]. É sobre a gestão da fatura de energia da [Empresa].

Fazemos uma análise técnica da demanda contratada, modalidade tarifária e demais condições de fornecimento para identificar oportunidades de redução de custos.

Preciso de dois minutos com quem responde por essa parte na empresa. É você ou consegue me indicar quem cuida disso?`,
    nota: "Se perguntarem do que se trata.",
  },
  naRecepcaoNunca: ['"É sobre uma proposta"', '"é uma oferta"', '"queria apresentar nossos serviços"'],
  instrucaoDaAbertura:
    "Os primeiros 15 segundos decidem a ligação. Peça permissão e pare de falar até ele responder.",
  aberturaComDecisor: {
    id: "ligacao.abertura_com_decisor",
    canal: "telefone",
    texto: `[Nome], bom dia. Aqui é [Vendedor], da AFB Engenharia & Consultoria Elétrica.

Te tomo um minuto e você me diz se faz sentido continuar, pode ser?

[pausa — esperar a resposta]

A gente faz análise técnica de faturas de energia de empresas atendidas em média tensão.

Olhamos a demanda contratada, a modalidade tarifária, as condições de fornecimento e o preço da energia para identificar se existe alguma oportunidade de reduzir esse custo.

E é importante dizer que não estamos falando de instalar nada: não vendemos equipamento, não tem obra e não exige investimento da sua parte.

A ideia é simplesmente verificar se a empresa está pagando pela energia nas condições mais adequadas para a operação atual.`,
  },
  instrucaoDoDiagnostico:
    'Uma pergunta, no máximo duas. Escolha uma. Escute a resposta inteira. É nela que está o gancho. Se ele disser "isso quem vê é o contador", você já sabe que ninguém faz análise técnica — e esse é exatamente o argumento.',
  perguntasDeDiagnostico: [
    '"Hoje alguém aí acompanha esses números, ou a conta chega e é paga?"',
    '"O que vocês contrataram de energia com a distribuidora já foi revisado alguma vez desde que a subestação entrou?"',
    '"Vocês já chegaram a olhar mercado livre, ou continuam comprando só da distribuidora?"',
  ],
  fechamentoDeAgenda: {
    id: "ligacao.fechamento_de_agenda",
    canal: "telefone",
    texto: `O que eu proponho é o seguinte:

Marcamos 30 minutos. Eu te mostro como a análise é feita, o que normalmente encontramos e onde podem existir oportunidades de redução.

E, se você me enviar uma fatura antes, eu já chego na conversa com os pontos específicos da [Empresa], em vez de ficar falando em tese.

Consigo [DIA] às [HORA] ou [DIA] às [HORA]. Qual dos dois fica melhor para você?`,
  },
  caixaPostal: {
    id: "ligacao.caixa_postal",
    canal: "telefone",
    texto:
      "[Nome], aqui é [Vendedor], da AFB Engenharia & Consultoria Elétrica. Liguei por causa da fatura de energia da [Empresa]. Te mandei uma mensagem no WhatsApp deste número com o resumo. Obrigado.",
    nota: "Deixe o recado e mande o WhatsApp em seguida, referenciando a ligação. O recado sozinho quase nunca gera retorno; o par recado + mensagem, sim.",
  },
};
