/**
 * afb_comercial_v1 — identidade, meta, princípios e placeholders.
 * Fonte: Playbook Comercial — Consultoria em Energia, Versão 6 — docs/afb/playbooks/afb-comercial-v1.html.
 */
import type { MetaDoPlaybook, Placeholder, PlaybookId, Principio } from "../types";

export const ID: PlaybookId = "afb_comercial_v1";
export const NOME = "Playbook Comercial — Consultoria em Energia";
export const VERSAO_DO_DOCUMENTO = "Versão 6";
export const FONTE = "AFB Engenharia & Consultoria Elétrica · Documento interno de treinamento comercial · Versão 6 · Uso restrito à equipe";

export const META: MetaDoPlaybook = {
  objetivoUnico: "agendar reunião de 30 minutos",
  faixaOficial: "10% a 35%",
  cicloDias: 15,
  areaDeConcessao: {
    distribuidora: "CEMIG",
    nota: "As copies deste playbook citam a CEMIG como distribuidora. Esta é a versão para Minas Gerais. Para prospect atendido por outra distribuidora, troque o nome antes de enviar.",
  },
  postura:
    "Não estamos pedindo um favor nem oferecendo promoção. Estamos oferecendo uma análise técnica que a empresa dele não tem, e que custa 30 minutos para ele entender. Quem fala de igual para igual com diretor é quem marca reunião com diretor.",
  regraQueNaoSeQuebra:
    "A sequência de seis mensagens é uma conversa, não um disparo. Cada mensagem só é enviada depois que o cliente respondeu à anterior. Mandar duas ou três seguidas sem resposta queima o contato e queima a lista.",
};

export const PRINCIPIOS: readonly Principio[] = [
  {
    ordem: 1,
    titulo: "Uma única chamada para ação: a reunião de 30 minutos.",
    detalhe: "Nunca oferecer duas coisas na mesma mensagem.",
  },
  {
    ordem: 2,
    titulo: "A faixa de 10% a 35% é histórico, não promessa.",
    detalhe: 'A formulação correta é "temos encontrado economias típicas entre 10% e 35%". Nunca "você vai reduzir 30%".',
  },
  {
    ordem: 3,
    titulo: "Não somos vendedores de energia. Somos engenharia.",
    detalhe: "Analisamos a instalação e o contrato — não apenas cotamos preço de kWh.",
  },
  {
    ordem: 4,
    titulo: 'A palavra "solar" nunca é puxada por nós.',
    detalhe: "Se o cliente perguntar, respondemos com clareza (ver objeções).",
  },
  {
    ordem: 5,
    titulo: "Nada de credenciamento com a distribuidora.",
    detalhe:
      "Trabalhamos com as principais comercializadoras do país: CEMIG, Shell Energy, Enel, Comerc Energia, Prime Energy, Origo e Energisa. Dizer que somos credenciados pela CEMIG como distribuidora é incorreto e cria problema.",
  },
  {
    ordem: 6,
    titulo: "A fatura é pedida na Etapa 7",
    detalhe: "depois do sim à reunião. Nunca no primeiro contato.",
  },
  {
    ordem: 7,
    titulo: "Manutenção e subestação não entram na abordagem.",
    detalhe: "Se o cliente puxar, confirmamos que fazemos e voltamos ao tema da fatura.",
  },
  {
    ordem: 8,
    titulo: "Falamos em nome da AFB.",
    detalhe: "O vendedor usa o diretor técnico como credencial em terceira pessoa.",
  },
  {
    ordem: 9,
    titulo: "Cada follow-up traz informação nova.",
    detalhe: '"Passando para saber se viu", "conseguiu analisar?" e "alguma novidade?" estão proibidos.',
  },
];

/**
 * Todo `[token]` que aparece em alguma copy do playbook. O teste de
 * invariantes varre as copies e reprova token que não esteja aqui — assim um
 * placeholder novo numa copy editada não passa despercebido.
 */
export const PLACEHOLDERS: readonly Placeholder[] = [
  { token: "Nome", tipo: "dado", descricao: "Primeiro nome do interlocutor" },
  { token: "Vendedor", tipo: "dado", descricao: "Seu primeiro nome" },
  { token: "Empresa", tipo: "dado", descricao: "Nome da empresa do cliente" },
  { token: "dia", tipo: "agenda", descricao: 'Sempre duas opções concretas. Nunca "quando você puder"' },
  { token: "hora", tipo: "agenda", descricao: 'Sempre duas opções concretas. Nunca "quando você puder"' },
  { token: "DIA", tipo: "agenda", descricao: "O mesmo que [dia], em caixa alta no roteiro de ligação", equivaleA: "dia" },
  { token: "HORA", tipo: "agenda", descricao: "O mesmo que [hora], em caixa alta no roteiro de ligação", equivaleA: "hora" },
  { token: "dia da semana que vem", tipo: "agenda", descricao: "Um dia da semana seguinte, na objeção «Não tenho tempo agora»" },
  { token: "Link ou endereço", tipo: "agenda", descricao: "Link da reunião online ou endereço do presencial, na confirmação" },
  { token: "Assinatura", tipo: "dado", descricao: "Assinatura padrão: Nome · Consultor Comercial · AFB Engenharia & Consultoria Elétrica · telefone · site" },
  { token: "X", tipo: "medida", descricao: "Demanda contratada, em kW, lida da fatura" },
  { token: "Y", tipo: "medida", descricao: "Maior demanda utilizada nos últimos 12 meses, em kW, lida da fatura" },
  { token: "INSERIR CASE DE ECONOMIA — PNG", tipo: "anexo", descricao: "Onde entra a imagem do case real (sem nome do cliente, sem logotipo, sem documento identificável)" },
  { token: "pausa — esperar a resposta", tipo: "instrucao", descricao: "Instrução ao vendedor no roteiro de ligação: parar de falar até o decisor responder" },
];
