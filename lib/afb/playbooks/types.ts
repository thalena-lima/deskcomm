/**
 * Playbooks comerciais — os TIPOS do conteúdo.
 *
 * ─── Motor × conteúdo ───────────────────────────────────────────────────────
 *
 *   lib/afb/playbook/   (singular)  MOTOR: a régua de etapas (`EtapaId`), os
 *                                   papéis das colunas, o mapeamento funil →
 *                                   playbook, os campos do lead. Regras puras
 *                                   que valem para QUALQUER playbook.
 *   lib/afb/playbooks/  (plural)    CONTEÚDO: o que se diz, em cada canal, em
 *                                   cada etapa — um diretório por playbook, e
 *                                   um registry que os entrega pelo id.
 *
 * A ponte entre os dois é UMA: a etapa de WhatsApp do conteúdo se identifica
 * pelo `EtapaId` do motor. É o que permite ao mapeamento (coluna → papel →
 * etapas permitidas) escolher a copy certa sem que o motor conheça copy
 * nenhuma — e o que impede dois ids para a mesma etapa.
 *
 * ─── Identidade ─────────────────────────────────────────────────────────────
 *
 * Um playbook tem id próprio, versionado (`afb_comercial_v1`), e NÃO é o nome
 * do funil: o mesmo playbook pode servir dois funis, e um funil pode trocar de
 * playbook. Quando o funil escolher o seu (`settings.modulos.copiloto_comercial
 * .playbook_id`, etapa futura), é este id que ele grava.
 *
 * ─── Copy é dado, não código ────────────────────────────────────────────────
 *
 * Nenhuma copy vive em componente React. O texto entra aqui como o playbook o
 * escreveu — inclusive o que pareça erro de digitação: o HTML é a fonte de
 * verdade, e corrigir copy comercial é decisão de quem vende, não de quem
 * programa. Os placeholders ficam INTACTOS (`[Nome]`, `[dia]`…); quem os
 * preenche é o copiloto, na hora de inserir.
 */
import type { EtapaId } from "@/lib/afb/playbook/etapas";

import type { PlaybookId } from "./catalogo";

/** A identidade é do CATÁLOGO (`catalogo.ts`): um id que não está lá não compila. */
export type { PlaybookId };

export type Canal = "whatsapp" | "email" | "telefone";

/** Como a tabela do playbook nomeia o canal de cada toque da cadência. */
export type CanalDoToque = "whatsapp_e_email" | "telefone" | "email";

export type PeriodoDoDia = "manha" | "tarde";

// ─── Placeholders ────────────────────────────────────────────────────────────

/**
 * `dado`      — vem do lead/contato/vendedor (Nome, Empresa, Vendedor).
 * `agenda`    — o vendedor escolhe na hora (dia, hora, link).
 * `medida`    — número lido da fatura (X kW, Y kW).
 * `anexo`     — marca onde entra um arquivo (case em PNG).
 * `instrucao` — não é preenchido: é uma instrução ao vendedor dentro do texto.
 */
export type TipoDePlaceholder = "dado" | "agenda" | "medida" | "anexo" | "instrucao";

export interface Placeholder {
  /** O texto EXATO entre colchetes como aparece nas copies, sem os colchetes. */
  token: string;
  tipo: TipoDePlaceholder;
  /** O que entra no lugar — a coluna "O que entra" da tabela, quando existe. */
  descricao: string;
  /**
   * Outro token que significa a mesma coisa (`DIA` é `dia` em caixa alta no
   * roteiro de ligação). Aponta para o token canônico.
   */
  equivaleA?: string;
}

// ─── Mensagens ───────────────────────────────────────────────────────────────

export interface Mensagem {
  /** Estável, com o prefixo da seção: `whatsapp.abertura`, `email.financeira`… */
  id: string;
  canal: Canal;
  /** O texto como está no playbook, placeholders inclusos. */
  texto: string;
  /** A nota "Atenção / Por que funciona / Quando usar" que acompanha a copy, se houver. */
  nota?: string;
}

// ─── Sequência de WhatsApp ───────────────────────────────────────────────────

/** Uma linha da tabela "Como usar a resposta". */
export interface CondicaoDeResposta {
  respostaDoCliente: string;
  leitura: string;
  paraOndeIr: string;
}

export interface EtapaWhatsapp {
  /** O id do MOTOR — a ponte com papéis e mapeamento. */
  id: EtapaId;
  /** 1..6 — a ordem do playbook. */
  ordem: number;
  titulo: string;
  objetivo: string;
  /** Uma copy oficial por etapa — o playbook v6 não tem variações no WhatsApp. */
  mensagem: Mensagem;
  /** O que o vendedor precisa saber antes de enviar — as notas da seção. */
  instrucoes: readonly string[];
  /** Só envia a próxima depois que o cliente respondeu a esta. */
  aguardarResposta: boolean;
  /** A regra de espera, quando a etapa a tem (Micro-SPIN: 24h e vai ao convite). */
  regraDeEspera?: string;
  /** O que fazer com a resposta — a tabela da Etapa 2, quando existe. */
  condicoes?: readonly CondicaoDeResposta[];
  /** Mensagem de ponte para um ramo da tabela (Etapa 2: "já acompanhamos"). */
  ponte?: Mensagem;
  proximaAcao: string;
  /** Guardrails que esta etapa invoca explicitamente. */
  guardrails: readonly string[];
}

// ─── Pós-sim (Etapa 7) e reunião ─────────────────────────────────────────────

export interface CenarioDeReuniao {
  cenario: string;
  comoAbrir: string;
  oQueNaoFazer: string;
}

export interface EtapaPosSim {
  id: Extract<EtapaId, "pos_sim">;
  ordem: 7;
  titulo: string;
  objetivo: string;
  /** Logo após o sim — confirma o horário e pede a fatura. */
  confirmacao: Mensagem;
  /** 24 horas antes da reunião. */
  lembrete24h: Mensagem;
  /** A linha extra do lembrete quando a fatura ainda não chegou. */
  lembreteSemFatura: string;
  /** Primeira reunião, com a fatura em mãos. */
  aberturaComFatura: Mensagem;
  conducaoDaReuniao: readonly CenarioDeReuniao[];
  /** As regras sobre o relatório e sobre o primeiro e o segundo encontro. */
  regras: readonly string[];
}

// ─── Follow-up ───────────────────────────────────────────────────────────────

export interface Toque {
  id: string;
  /** D0..Dn — dias corridos desde a abordagem inicial. */
  dia: number;
  /** "Toque" na tabela: Abordagem inicial, Ligação 1, Follow-up 1… */
  rotulo: string;
  canal: CanalDoToque;
  /** "Conteúdo" na tabela: o tema do toque. */
  tema: string;
  periodo?: PeriodoDoDia;
  /** A copy do toque, quando o playbook a tem (ligação e abordagem remetem a outra seção). */
  mensagem?: Mensagem;
  /** Para onde o toque aponta quando não tem copy própria. */
  remeteA?: "whatsapp.abertura" | "ligacao";
  /** O toque leva um case em PNG no lugar do marcador. */
  anexo?: "case_png";
}

/** Uma faixa de horário em que um toque pode sair, em minutos desde a meia-noite (fim exclusivo). */
export interface FaixaDeHorario {
  inicioMin: number;
  fimMin: number;
}

/**
 * Quando um toque pode sair — a regra de horários do playbook, em forma que o
 * motor consegue avaliar. Dias da semana como `Date#getDay()` (0 = domingo).
 */
export interface JanelaDeContato {
  faixas: readonly FaixaDeHorario[];
  diasPermitidos: readonly number[];
  /** Combinações que o playbook desaconselha sem proibir (quem decide é o vendedor). */
  desaconselhados: readonly { diaDaSemana: number; periodo: PeriodoDoDia }[];
  /** A fronteira entre "manhã" e "tarde", em minutos desde a meia-noite. */
  inicioDaTardeMin: number;
}

export interface Cadencia {
  /** O título da seção no playbook ("Cadência de follow-up"). */
  titulo: string;
  /** O lede da seção — para quem é e o que cada toque precisa fazer. */
  objetivo: string;
  /** Dias do ciclo completo, do primeiro contato ao encerramento. */
  cicloDias: number;
  toques: readonly Toque[];
  /** Qualquer resposta do prospect tira o lead da cadência. */
  respostaInterrompe: true;
  /** Para onde a conversa volta quando ele responde. */
  aoResponder: string;
  /** Depois do último toque. */
  reciclagemMeses: number;
  janela: JanelaDeContato;
  regras: readonly string[];
  regraDosCases: string;
}

// ─── E-mail ──────────────────────────────────────────────────────────────────

export type VariacaoEmailId = "financeira" | "curiosidade" | "consultiva";

export interface VariacaoEmail {
  id: VariacaoEmailId;
  /** O rótulo da aba: "A · Financeira". */
  rotulo: string;
  assunto: string;
  corpo: Mensagem;
  quandoUsar: string;
}

export interface EmailDeAbertura {
  descricao: string;
  regraDoAssunto: string;
  variacoes: readonly VariacaoEmail[];
  assinaturaPadrao: string;
  notaSobreAssinatura: string;
}

// ─── Ligação ─────────────────────────────────────────────────────────────────

export interface RoteiroDeLigacao {
  descricao: string;
  recepcao: Mensagem;
  doQueSeTrata: Mensagem;
  /** O que NUNCA dizer na recepção. */
  naRecepcaoNunca: readonly string[];
  aberturaComDecisor: Mensagem;
  /** A instrução que precede a abertura: pedir permissão e parar de falar. */
  instrucaoDaAbertura: string;
  perguntasDeDiagnostico: readonly string[];
  instrucaoDoDiagnostico: string;
  fechamentoDeAgenda: Mensagem;
  caixaPostal: Mensagem;
}

// ─── Objeções ────────────────────────────────────────────────────────────────

export interface Objecao {
  id: string;
  /** A frase do cliente, como o playbook a escreve (pode ter duas variantes). */
  gatilho: string;
  /** "Por trás: …" */
  porTras: string;
  resposta: Mensagem;
  observacao?: string;
  proximaAcao?: string;
}

// ─── Guardrails ──────────────────────────────────────────────────────────────

export type CategoriaDeGuardrail =
  | "promessas"
  | "cta"
  | "energia_solar"
  | "distribuidora"
  | "fatura"
  | "subestacao"
  | "emojis"
  | "audio"
  | "sequencia_de_mensagens"
  | "relatorio"
  | "cases"
  | "mercado_livre"
  | "horarios"
  | "linguagem"
  | "follow_up"
  | "postura";

/**
 * `nunca`   — "O que nunca dizer": proibição seca.
 * `regra`   — princípio ou regra de processo.
 * `atencao` — nota de cuidado ligada a uma copy.
 */
export type SeveridadeDeGuardrail = "nunca" | "regra" | "atencao";

export interface Guardrail {
  id: string;
  categoria: CategoriaDeGuardrail;
  severidade: SeveridadeDeGuardrail;
  /** O texto do playbook, como está. */
  regra: string;
  /** A seção do playbook de onde veio. */
  origem: string;
  /**
   * Termos que, digitados pelo vendedor, sugerem que a regra está sendo
   * quebrada — para o copiloto AVISAR (nunca bloquear). Só onde o próprio
   * playbook nomeia a expressão proibida.
   */
  termosDeAlerta?: readonly string[];
}

// ─── Apoio ───────────────────────────────────────────────────────────────────

export interface Principio {
  ordem: number;
  titulo: string;
  detalhe: string;
}

export interface Metrica {
  indicador: string;
  comoMedir: string;
  quandoBaixo: string;
}

export interface MetaDoPlaybook {
  objetivoUnico: string;
  faixaOficial: string;
  cicloDias: number;
  /** A distribuidora citada nas copies e a nota de área de concessão. */
  areaDeConcessao: { distribuidora: string; nota: string };
  postura: string;
  regraQueNaoSeQuebra: string;
}

// ─── O playbook ──────────────────────────────────────────────────────────────

export interface Playbook {
  id: PlaybookId;
  nome: string;
  /** A versão do DOCUMENTO de origem ("Versão 6"), não a do id. */
  versaoDoDocumento: string;
  fonte: string;
  meta: MetaDoPlaybook;
  principios: readonly Principio[];
  placeholders: readonly Placeholder[];
  whatsapp: {
    etapas: readonly EtapaWhatsapp[];
    posSim: EtapaPosSim;
  };
  followup: Cadencia;
  email: EmailDeAbertura;
  ligacao: RoteiroDeLigacao;
  objecoes: readonly Objecao[];
  guardrails: readonly Guardrail[];
  metricas: readonly Metrica[];
  /** Notas de teste controlado e afins. */
  notasDeMetricas: readonly string[];
  emDesenvolvimento: readonly string[];
}
