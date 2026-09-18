/**
 * afb_comercial_v1 — o e-mail de abertura, nas TRÊS variações do playbook.
 *
 * As variações A/B/C pertencem ao canal de e-mail e só a ele. Não há
 * equivalente no WhatsApp — lá cada etapa tem uma copy única.
 */
import type { EmailDeAbertura } from "../types";

export const EMAIL: EmailDeAbertura = {
  descricao: "Mesma lógica do WhatsApp, com narrativa mais desenvolvida. O CTA pede o telefone. Material gráfico segue em anexo.",
  regraDoAssunto:
    'Nenhum assunto traz percentual, cifrão ou a palavra "economia". Esse é o padrão que filtro de spam e olho treinado descartam juntos. Assunto descritivo, com o nome da empresa quando possível.',
  assinaturaPadrao:
    "Nome · Consultor Comercial · AFB Engenharia & Consultoria Elétrica · telefone · site. Sem frase motivacional, sem banner, sem imagem pesada.",
  notaSobreAssinatura:
    "As três versões são assinadas pelo vendedor, com o diretor técnico em terceira pessoa. Se o envio for feito pelo próprio engenheiro consultor, a variação C ganha força e a redação passa para primeira pessoa.",
  variacoes: [
    {
      id: "financeira",
      rotulo: "A · Financeira",
      assunto: "Redução de custo de energia — [Empresa]",
      quandoUsar:
        "Lead já identificado, ou resposta a quem pediu material por escrito. É a mais completa e a mais longa: entrega escopo, número e as duas frentes detalhadas. Para disparo em volume, o comprimento reduz a leitura — nesse caso prefira a versão B.",
      corpo: {
        id: "email.financeira",
        canal: "email",
        texto: `Olá, [Nome], bom dia.

Sou [Vendedor], da AFB Engenharia & Consultoria Elétrica, empresa de engenharia especializada em subestações e consultoria em energia.

Entro em contato porque ajudamos empresas com fornecimento em média tensão a reduzir, em média, de 10% a 35% o custo da energia, por meio de consultorias e análises técnicas.

E o mais importante: essa redução não depende de obra, instalação de equipamentos ou investimento em CAPEX.

A economia vem da própria análise da estrutura atual da empresa, identificando oportunidades e realizando os ajustes técnicos e contratuais necessários para que ela deixe de pagar por condições que não fazem mais sentido para o seu perfil.

Basicamente, trabalhamos em duas frentes:

1. A forma como sua empresa paga pela energia
As condições contratadas com a distribuidora muitas vezes foram definidas há anos e permanecem iguais mesmo depois de mudanças na operação, no consumo ou no perfil da empresa.
Analisamos a fatura, a demanda contratada, a estrutura tarifária e outras condições de fornecimento para identificar oportunidades de redução.

2. O preço da energia
Também avaliamos o custo da própria energia e as alternativas de contratação disponíveis para o perfil da empresa, comparando as condições atuais com as opções disponíveis no mercado.

A distribuidora continua sendo a mesma. A rede, a manutenção e o atendimento de emergência não mudam.
Nada precisa ser instalado e a operação da empresa continua normalmente.

A redução vem da gestão: análise dos dados, identificação das oportunidades e realização dos ajustes técnicos e contratuais aplicáveis ao caso.

Para iniciar a análise, precisamos apenas de uma fatura recente. A avaliação inicial é feita sem custo.

O próximo passo é uma conversa de aproximadamente 30 minutos, online ou presencialmente para empresas da região metropolitana de Belo Horizonte. Nessa conversa, apresentamos o método, entendemos o cenário da [Empresa] e verificamos se existe potencial de redução.

Se fizer sentido, me envie seu melhor número de WhatsApp e entro em contato para combinarmos o horário.

Estou deixando em anexo um material explicativo sobre o trabalho.

Fico à disposição,
[Assinatura]
[Vendedor]
AFB Engenharia & Consultoria Elétrica`,
      },
    },
    {
      id: "curiosidade",
      rotulo: "B · Curiosidade",
      assunto: "Um item da fatura de energia da [Empresa]",
      quandoUsar:
        "Lead de valor alto. Abre com o problema, não com a empresa: as três primeiras linhas descrevem uma situação concreta antes de qualquer apresentação institucional, o que reduz a chance de ser lido como e-mail comercial. A frase que admite que pode não haver economia é o que dá credibilidade ao resto.",
      corpo: {
        id: "email.curiosidade",
        canal: "email",
        texto: `Olá, [Nome], bom dia.

Sou [Vendedor], da AFB Engenharia & Consultoria Elétrica.

Toda empresa atendida em média tensão possui uma demanda contratada com a distribuidora — um valor que faz parte da cobrança mensal e que muitas vezes foi definido quando a instalação entrou em operação.

Só que a empresa muda.

Troca equipamentos, altera turnos, aumenta ou reduz a produção, tira máquinas de linha... e, muitas vezes, essa contratação permanece igual por anos.

Esse é um dos pontos que analisamos — e não é o único.

Também verificamos se o modelo de cobrança e as condições tarifárias continuam adequados ao perfil atual de consumo da empresa.

Além disso, avaliamos o preço da própria energia e, quando aplicável ao perfil da empresa, comparamos as condições disponíveis junto às principais comercializadoras do mercado.

Pode ser que na [Empresa] não exista nada relevante para ajustar. Acontece — e, quando acontece, nós dizemos.

Mas, se houver alguma oportunidade, pode ser um custo que vem sendo pago todos os meses simplesmente porque nunca foi revisado.

Para verificar, precisamos apenas de uma fatura recente.

A análise é gratuita e não envolve obra, investimento em CAPEX ou qualquer mudança na operação da empresa. A distribuidora continua a mesma, assim como a rede e o atendimento.

Toda a economia identificada vem da análise técnica, revisão das condições de contratação e dos ajustes aplicáveis ao perfil da empresa.

Vale uma conversa de 30 minutos para descobrir de que lado a sua empresa está?

Se fizer sentido, me envie seu melhor número de WhatsApp e entro em contato para marcarmos.

Segue em anexo um material explicativo sobre o trabalho.

Atenciosamente,
[Assinatura]`,
      },
    },
    {
      id: "consultiva",
      rotulo: "C · Consultiva",
      assunto: "Análise técnica de fatura — empresas em média tensão",
      quandoUsar:
        "Diretor e proprietário de empresa de porte, especialmente quando o e-mail será encaminhado internamente — é a única que aguenta ser lida por terceiros sem contexto.",
      corpo: {
        id: "email.consultiva",
        canal: "email",
        texto: `Olá, [Nome], bom dia.

Sou [Vendedor], da AFB Engenharia & Consultoria Elétrica.

Somos uma empresa de engenharia elétrica especializada em subestações de média e alta tensão e em consultoria de energia. Nosso diretor técnico é engenheiro eletricista, com 11 anos de experiência na CEMIG, incluindo atuação na área de expansão de ativos de alta tensão.

Energia é um custo relevante para qualquer indústria, mas muitas vezes não recebe a mesma atenção dedicada a matéria-prima, frete ou folha. Esses custos são constantemente negociados e revisados; a conta de energia, muitas vezes, simplesmente chega e é paga.

É justamente aí que podem existir oportunidades.

Nosso trabalho atua em duas frentes:

Análise técnica da fatura
Verificamos se o que sua empresa contratou com a distribuidora continua compatível com o perfil atual de consumo e operação, além de avaliar se a estrutura tarifária e as condições de fornecimento continuam adequadas.

Cotação da energia
Comparamos o custo atual da energia com as condições disponíveis junto às principais comercializadoras do país, considerando o perfil e as características de consumo da empresa.

As duas análises se complementam. Nos casos em que identificamos oportunidades nas duas frentes, o potencial de redução pode ser significativo. Nas análises que realizamos, já identificamos reduções na faixa de 10% a 35% do custo da energia, dependendo do perfil e das condições de cada empresa.

E isso sem obra, sem investimento em CAPEX e sem alteração na operação. A distribuidora permanece a mesma, assim como a rede, a manutenção e o atendimento de emergência.

A análise inicial é feita sem custo e exige apenas uma fatura recente.

Proponho uma conversa de 30 minutos para apresentar o método, entender o cenário da [Empresa] e verificar se existe potencial de redução no seu caso.

Podemos fazer online ou presencialmente, se vocês estiverem na região metropolitana de Belo Horizonte.

Para agendarmos, me envie seu melhor número de WhatsApp e entro em contato para combinarmos o horário.

Em anexo, envio um material com o detalhamento do processo.

Cordialmente,
[Assinatura]`,
      },
    },
  ],
};
