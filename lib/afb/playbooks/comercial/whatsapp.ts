/**
 * afb_comercial_v1 — a sequência de WhatsApp (Etapas 1 a 6).
 *
 * UMA copy por etapa. O playbook v6 não tem variações no WhatsApp — as
 * variações A/B/C existem só no e-mail (`email.ts`). As copies estão como no
 * documento, inclusive a grafia; o HTML é a fonte de verdade.
 */
import type { EtapaWhatsapp } from "../types";

export const ETAPAS_WHATSAPP: readonly EtapaWhatsapp[] = [
  {
    id: "abertura",
    ordem: 1,
    titulo: "Abertura / Atenção",
    objetivo:
      "Comprar o direito de continuar falando. Esta mensagem não pede reunião. Se o convite de 30 minutos vier aqui, o cliente recusa antes de saber do que se trata.",
    mensagem: {
      id: "whatsapp.abertura",
      canal: "whatsapp",
      texto: `Olá bom dia! Aqui é [Vendedor], da AFB Engenharia & Consultoria.

Atuamos com consultoria de eficiência energética.

Estamos realizando estudo técnico para identificar custos desnecessários na conta de energia e oportunidades de redução mensal.

Essas correções podem gerar economia relevantes, sem necessidade de obras ou investimento em equipamentos. Nos nossos estudos, temos encontrado economias típicas entre 10% a 35%, a depender do perfil de consumo da empresa.

Posso te explicar rapidamente como funciona?`,
      nota: '"Sem necessidade de obras ou investimento" vem antes do percentual de propósito: é o que separa a AFB do vendedor de usina logo na leitura inicial. E "a depender do perfil de consumo" é o que mantém a faixa como histórico e não como promessa — não corte.',
    },
    instrucoes: [
      "Esta mensagem não pede reunião.",
      "Mensagem com [Nome] não preenchido encerra a conversa antes de ela começar — substitua os campos entre colchetes e revise antes de enviar.",
    ],
    aguardarResposta: true,
    proximaAcao: "Se respondeu: Etapa 2. Se não respondeu: entra na cadência de follow-up (D1 é a Ligação 1).",
    guardrails: ["nunca.tudo_bem_como_abertura", "nunca.audio_no_primeiro_contato", "principio.faixa_e_historico", "principio.uma_cta"],
  },
  {
    id: "qualificacao",
    ordem: 2,
    titulo: "Qualificação / Situação",
    objetivo:
      "Só é enviada depois da resposta à Etapa 1. A permissão já foi dada, então vá direto à pergunta. Uma pergunta só.",
    mensagem: {
      id: "whatsapp.qualificacao",
      canal: "whatsapp",
      texto: `Ótimo. Antes de entrar nos detalhes, gostaria de entender um pouco melhor o cenário de vocês:

Hoje você tem clareza de como os custos com energia são formados e quais dessas componentes podem ser ajustadas para reduzir o valor final da conta?`,
    },
    instrucoes: [
      "Pergunta múltipla no WhatsApp é respondida pela metade ou não é respondida. E pergunta que expõe ignorância faz o gestor sumir em vez de admitir que não sabe. Quem decide não gosta de ser exposto no próprio terreno.",
    ],
    aguardarResposta: true,
    condicoes: [
      {
        respostaDoCliente: '"Não" · "não sei" · "quem vê é o financeiro"',
        leitura: "Ninguém revisa. Melhor cenário, e o mais comum.",
        paraOndeIr: "Etapa 3, direto",
      },
      {
        respostaDoCliente: '"Tenho clareza" · "a gente acompanha"',
        leitura: "Pode ser verdade ou defesa. Não confrontar.",
        paraOndeIr: "Ponte abaixo, depois Etapa 3",
      },
      {
        respostaDoCliente: '"Já temos consultoria" · "já migramos"',
        leitura: "Não é objeção, é informação.",
        paraOndeIr: "Ver objeções",
      },
    ],
    ponte: {
      id: "whatsapp.qualificacao.ponte_ja_acompanha",
      canal: "whatsapp",
      texto:
        "Que bom, é raro. Então você provavelmente já olhou demanda contratada e modalidade tarifária. A parte que quase ninguém revisa é o preço da energia em si, que hoje dá para negociar fora da distribuidora. É por aí que costumamos reduzir custos.",
    },
    proximaAcao: "Etapa 3 (direto, ou depois da ponte). «Já temos consultoria» vai para a biblioteca de objeções.",
    guardrails: ["regra.uma_pergunta_so"],
  },
  {
    id: "gancho_de_valor",
    ordem: 3,
    titulo: "Gancho de valor",
    objetivo:
      "Não é para explicar a consultoria inteira. É para o cliente perceber que existe algo na conta dele que nunca foi olhado.",
    mensagem: {
      id: "whatsapp.gancho_de_valor",
      canal: "whatsapp",
      texto: `Nossa consultoria atua em duas frentes.

A primeira é a análise da fatura e instalação. Verificamos o seu perfil de consumo e comparamos com o melhor modelo de contratação. Nessa analise normalmente identificamos custos que podem ser reduzidos por meio de ajustes técnicos.

A segunda frente é o preço da energia. Cotamos com as principais comercializadoras do mercado e comparamos com o que a empresa paga hoje. Conseguimos ofertar um custo por kw/h muito menor do que o praticado.

É justamente analisando essas duas frentes que encontramos as oportunidades de economia que comentei, que variam de 10 a 35% do custo por mes.`,
      nota: '"Conseguimos ofertar um custo por kW/h muito menor do que o praticado" é a única afirmação categórica do funil, e é feita antes da cotação. Se em algum caso a comercializadora não bater o preço da distribuidora, é a frase que o cliente vai lembrar na reunião de fechamento. Use com consciência disso.',
    },
    instrucoes: ["Cuidado no fechamento: a frase sobre o custo por kW/h é categórica e antecede a cotação."],
    aguardarResposta: true,
    proximaAcao: "Etapa 4.",
    guardrails: ["atencao.afirmacao_categorica_kwh", "principio.faixa_e_historico"],
  },
  {
    id: "desarme_de_risco",
    ordem: 4,
    titulo: "Desarme de risco",
    objetivo:
      "O que impede o sim agora não é falta de interesse: é medo de obra, de custo e de mexer na operação. Esta mensagem responde tudo antes de ele perguntar.",
    mensagem: {
      id: "whatsapp.desarme_de_risco",
      canal: "whatsapp",
      texto: `Só para adiantar as dúvidas mais comuns:

Não é energia solar, não tem obra e não exige investimento em equipamentos.

A distribuidora (CEMIG) continua a mesma, cuidando da rede, manutenção e emergências. Sua operação não muda.

O que fazemos é um estudo técnico para identificar uma forma mais eficiente de contratar e gerir sua energia.`,
      nota: "Troque a distribuidora quando necessário. CEMIG está escrita para Minas. Prospect de outra área de concessão exige o nome correto, senão a frase erra na cara do cliente.",
    },
    instrucoes: [
      "O motivo da gratuidade ficou de fora de propósito: explicar aqui que a remuneração vem da comercializadora abre discussão sobre modelo de negócio no meio de uma mensagem que serve para tirar objeções. Isso entra na reunião, na hora do preço. Se o cliente perguntar antes, use a resposta completa em objeções.",
    ],
    aguardarResposta: true,
    proximaAcao: "Etapa 5. Se o cliente perguntar quanto custa, responder pela objeção «Quanto custa?».",
    guardrails: ["atencao.trocar_distribuidora", "regra.gratuidade_fica_para_a_reuniao"],
  },
  {
    id: "micro_spin",
    ordem: 5,
    titulo: "Micro-SPIN",
    objetivo:
      "Fazer o cliente concluir sozinho que vale investigar. A conclusão precisa ser dele — por isso termina em pergunta e não antecipa a resposta.",
    mensagem: {
      id: "whatsapp.micro_spin",
      canal: "whatsapp",
      texto: `Se aumenta o custo com matéria-prima, frete ou folha, a empresa normalmente para, analisa e busca alternativas.

Com energia, muitas vezes a conta simplesmente chega e é paga.

Mas energia também é um custo operacional importante. Não faz sentido revisar esse custo com a mesma atenção dos demais?`,
    },
    instrucoes: [
      "Enviar e esperar. Esta é a única mensagem da sequência que exige silêncio depois. Se o vendedor emendar o convite no mesmo envio, ele responde a pergunta pelo cliente e perde o efeito inteiro — o sim mental precisa acontecer antes do convite chegar.",
    ],
    // A única etapa da sequência em que avançar sem resposta é a regra: 24h.
    aguardarResposta: false,
    regraDeEspera:
      "Se a resposta for evasiva ou não vier em 24h, não repita a pergunta. Vá direto para a Etapa 6: o convite é, ele próprio, uma forma de o cliente responder.",
    proximaAcao: "Etapa 6 — depois da resposta, ou após 24h sem ela.",
    guardrails: ["regra.enviar_e_esperar"],
  },
  {
    id: "convite",
    ordem: 6,
    titulo: "Convite para a reunião",
    objetivo:
      "Tudo já foi explicado. Esta mensagem faz uma coisa só: transformar interesse em horário marcado. Sempre com duas opções concretas.",
    mensagem: {
      id: "whatsapp.convite",
      canal: "whatsapp",
      texto: `O próximo passo é uma reunião de 30 minutos.

Nessa conversa, eu te apresento nosso método, entendo o cenário da sua empresa e avaliamos o potencial de economia.

Com base na fatura, disponibilizaremos o relatório técnico com o diagnostico energético da sua empresa, de forma gratuita, com dados e números, onde estão as oportunidades de economia e quanto pode ser reduzido por mês.

Tenho disponibilidade [dia] às [hora] ou [dia] às [hora]. Qual funciona melhor para você?`,
      nota: "O relatório é o que compra os 30 minutos. Sem ele, o cliente avalia se vale ouvir uma apresentação. Com ele, avalia se vale receber um diagnóstico da própria empresa. A fatura que torna isso possível é pedida na Etapa 7, logo após o sim.",
    },
    instrucoes: [
      "Apresentamos, não enviamos. Se o vendedor prometer mandar por e-mail, o cliente recebe, agradece e some — e a reunião de fechamento se perde. O relatório é apresentado na segunda reunião e entregue ali.",
      "A regra do achado único continua valendo. Um ponto da fatura na primeira reunião. O relatório completo e o consolidado de economia ficam para a segunda.",
    ],
    aguardarResposta: true,
    proximaAcao: "Com o sim: Etapa 7 (confirmação e captação da fatura).",
    guardrails: ["principio.uma_cta", "regra.duas_opcoes_de_horario", "regra.relatorio_apresentado_nao_enviado", "regra.achado_unico"],
  },
];
