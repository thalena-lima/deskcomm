/**
 * afb_comercial_v1 — a biblioteca de objeções (11), como no playbook.
 *
 * Estrutura de resposta em todos os casos: reconhecer sem discutir →
 * reenquadrar com informação → devolver o convite.
 */
import type { Objecao } from "../types";

export const ESTRUTURA_DE_RESPOSTA =
  "Reconhecer sem discutir → reenquadrar com informação → devolver o convite.";

export const OBJECOES: readonly Objecao[] = [
  {
    id: "energia_solar",
    gatilho: '"Isso é energia solar?"',
    porTras: "Ele já foi abordado por vendedor de usina e está triando.",
    resposta: {
      id: "objecao.energia_solar",
      canal: "whatsapp",
      texto: `Não. Você não compra usina, não instala painel, não financia equipamento e não tem obra na sua planta.

Somos engenharia elétrica. O que fazemos é análise técnica da fatura e do contrato de energia. Redução de custo sem investimento.`,
    },
  },
  {
    id: "quanto_custa",
    gatilho: '"Quanto custa?"',
    porTras: "Ele quer saber onde está a pegadinha do gratuito. Transparência total é o que constrói confiança aqui.",
    resposta: {
      id: "objecao.quanto_custa",
      canal: "whatsapp",
      texto: `Nesta campanha, nada. O estudo é gratuito e você recebe o relatório completo.

Somos remunerados pela comercializadora quando o cliente decide migrar a contratação da energia. Se a análise mostrar que migrar não compensa no seu caso, a gente te diz isso — e o relatório é seu do mesmo jeito.

Se aparecer necessidade de serviço de engenharia em campo, aí sim vai uma proposta separada, e nada é executado sem sua aprovação.`,
    },
  },
  {
    id: "ja_temos_consultoria",
    gatilho: '"Já temos uma consultoria" / "Já estamos no mercado livre"',
    porTras: "Pode ser verdade, pode ser escudo. Nos dois casos a resposta é a mesma, e é forte.",
    resposta: {
      id: "objecao.ja_temos_consultoria",
      canal: "whatsapp",
      texto: `Ótimo, então metade do caminho já foi feita.

Só que a migração resolve o preço da energia. Ela não mexe no que foi contratado com a distribuidora nem no modelo de cobrança, que continuam na parte regulada da fatura.

É comum a gente encontrar oportunidade justamente em cliente que já migrou. Se quiser, eu olho essa parte. Trinta minutos.`,
    },
    proximaAcao: "Devolver o convite de 30 minutos.",
  },
  {
    id: "preso_em_contrato",
    gatilho: '"E se eu quiser voltar atrás? Vou ficar preso em contrato?"',
    porTras: "A maior objeção do mercado livre. Aqui temos um argumento real.",
    resposta: {
      id: "objecao.preso_em_contrato",
      canal: "whatsapp",
      texto: `Depende do produto, e essa é justamente uma das coisas que a gente avalia.

Existem modelos sem carência nenhuma. O mercado livre tradicional tem prazo contratual, que varia conforme a negociação.

Na apresentação a gente coloca as opções lado a lado com prazo, preço e risco, e você escolhe. Não somos nós que definimos isso por você.`,
    },
  },
  {
    id: "trocar_distribuidora",
    gatilho: '"Vou ter que trocar de distribuidora? E se faltar energia?"',
    porTras: "Medo operacional. Continuidade vale mais que economia para gestor industrial.",
    resposta: {
      id: "objecao.trocar_distribuidora",
      canal: "whatsapp",
      texto: `Nada muda na operação. O fio continua sendo da distribuidora, a manutenção da rede continua com ela e o atendimento de emergência também.

O que muda é de quem você compra a energia. A parte física não se move e não tem interrupção nenhuma na sua produção.`,
    },
  },
  {
    id: "sem_tempo",
    gatilho: '"Não tenho tempo agora"',
    porTras: "Prioridade, não agenda. Não insista no mesmo dia.",
    resposta: {
      id: "objecao.sem_tempo",
      canal: "whatsapp",
      texto: `Entendo. Por isso são 30 minutos e não uma tarde.

Prefere [dia da semana que vem] de manhã ou no fim da tarde? Eu me adapto ao seu horário.`,
    },
    observacao: "Não insista no mesmo dia.",
  },
  {
    id: "falar_com_socio",
    gatilho: '"Preciso falar com meu sócio / com a diretoria"',
    porTras: "Ou é verdade, ou ele não quer decidir sozinho. Nos dois casos, traga a outra pessoa para dentro.",
    resposta: {
      id: "objecao.falar_com_socio",
      canal: "whatsapp",
      texto: `Faz sentido. Chama ele para a conversa, então — assim vocês ouvem juntos e ninguém precisa repassar depois.

Qual o melhor horário para os dois?`,
    },
  },
  {
    id: "sem_interesse",
    gatilho: '"Não temos interesse"',
    porTras: "Encerrar com elegância, mas deixar uma pergunta que às vezes reabre a porta.",
    resposta: {
      id: "objecao.sem_interesse",
      canal: "whatsapp",
      texto: `Sem problema, [Nome]. Obrigado pela franqueza.

Só uma pergunta antes de encerrar, por curiosidade técnica: o que vocês contrataram de energia com a distribuidora já foi revisado alguma vez desde que a subestação entrou em operação?`,
    },
    observacao: 'Se a resposta for "não" ou "não sei", há abertura. Se for "sim, revisamos ano passado", agradeça e encerre de verdade.',
    proximaAcao: '"Não temos interesse" encerra a cadência de follow-up na hora — não se envia o restante.',
  },
  {
    id: "acesso_a_conta",
    gatilho: '"Como vocês vão ter acesso à minha conta? Isso é seguro?"',
    porTras: "Receio com dado e com procuração.",
    resposta: {
      id: "objecao.acesso_a_conta",
      canal: "whatsapp",
      texto: `Para a análise, só preciso da fatura em PDF — o mesmo documento que você recebe todo mês. Nada além disso.

Procuração junto à distribuidora só entra depois, se você aprovar algum ajuste que exija solicitação formal. E isso é sempre com assinatura sua, item por item.`,
    },
  },
  {
    id: "mais_informacao_por_escrito",
    gatilho: '"Manda mais informação por escrito"',
    porTras: "Pode ser interesse real ou forma educada de adiar. Atenda e devolva o convite.",
    resposta: {
      id: "objecao.mais_informacao_por_escrito",
      canal: "whatsapp",
      texto: `Mando sim, te envio nosso material.

Só te adianto que ele sozinho não diz nada sobre a [Empresa] — explica o método. O que interessa mesmo são os números da sua fatura, e isso a gente só vê olhando.

Te mando agora e marcamos 30 minutos para eu passar pelo que for relevante no seu caso. Prefere [dia] ou [dia]?`,
    },
    proximaAcao: "Enviar o material e devolver o convite com dois dias.",
  },
  {
    id: "nao_sou_eu",
    gatilho: '"Não sou eu quem cuida disso"',
    porTras: "Melhor resposta possível em prospecção fria: ele está te dando o caminho.",
    resposta: {
      id: "objecao.nao_sou_eu",
      canal: "whatsapp",
      texto: `Entendi, obrigado por avisar. Quem responde pela energia aí na [Empresa]?

Se puder me passar o nome eu falo direto com a pessoa, sem te incomodar mais.`,
    },
  },
];
