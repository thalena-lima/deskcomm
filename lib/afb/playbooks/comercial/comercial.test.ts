/**
 * Invariantes do afb_comercial_v1 — estrutura, ids e regras do documento.
 *
 * Nada aqui compara copy byte a byte: editar uma frase do playbook não pode
 * quebrar teste. O que se prende é o que NÃO pode mudar sem alguém notar: a
 * ordem das etapas, os dias da cadência, os canais, os ids, os placeholders
 * conhecidos, a ausência da cadência antiga e a presença das regras.
 */
import { describe, expect, it } from "vitest";

import { cadenciaEncerrada, janelaDoToque, proximoToque, ultimoToque } from "@/lib/afb/playbook/cadencia";
import { ETAPAS_IDS, SEQUENCIA_IDS, etapaEstrutural } from "@/lib/afb/playbook/etapas";
import { papel } from "@/lib/afb/playbook/papeis";

import { etapaDoPlaybookComercial, metadadosDaEtapa, placeholdersDaMensagem, todasAsMensagens, tokensDoTexto } from "../registry";
import { AFB_COMERCIAL_V1 as P } from "./index";

const naoVazio = (s: string | undefined) => typeof s === "string" && s.trim().length > 0;

describe("identidade e meta", () => {
  it("id, nome, fonte e meta do documento v6", () => {
    expect(P.id).toBe("afb_comercial_v1");
    expect(P.meta.cicloDias).toBe(15);
    expect(P.meta.faixaOficial).toBe("10% a 35%");
    expect(P.meta.objetivoUnico).toContain("30 minutos");
    expect(P.meta.areaDeConcessao.distribuidora).toBe("CEMIG");
    expect(naoVazio(P.meta.regraQueNaoSeQuebra)).toBe(true);
    expect(naoVazio(P.meta.postura)).toBe(true);
  });

  it("9 princípios, numerados 1..9, todos com título", () => {
    expect(P.principios.map((p) => p.ordem)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const p of P.principios) expect(naoVazio(p.titulo)).toBe(true);
  });
});

describe("sequência de WhatsApp", () => {
  it("são as seis etapas da sequência, na ordem 1..6, com os ids do MOTOR", () => {
    expect(P.whatsapp.etapas.map((e) => e.id)).toEqual([
      "abertura",
      "qualificacao",
      "gancho_de_valor",
      "desarme_de_risco",
      "micro_spin",
      "convite",
    ]);
    expect(P.whatsapp.etapas.map((e) => e.ordem)).toEqual([1, 2, 3, 4, 5, 6]);
    // Cada id existe na régua do motor e é da sequência — a ponte com papéis/mapeamento.
    for (const e of P.whatsapp.etapas) expect(etapaEstrutural(e.id).tipo).toBe("sequencia");
    // E o playbook cobre a SEQUÊNCIA inteira do motor, na mesma ordem.
    expect(P.whatsapp.etapas.map((e) => e.id)).toEqual([...SEQUENCIA_IDS]);
    expect(P.whatsapp.posSim.id).toBe("pos_sim");
    // O motor tem 8 ids; o conteúdo cobre 6 + pós-sim; follow-up é a cadência.
    expect(ETAPAS_IDS).toHaveLength(8);
  });

  it("UMA copy por etapa — sem variações no WhatsApp", () => {
    for (const e of P.whatsapp.etapas) {
      expect(e.mensagem.canal).toBe("whatsapp");
      expect(e.mensagem.id).toBe(`whatsapp.${e.id}`);
      expect(naoVazio(e.mensagem.texto)).toBe(true);
      expect(naoVazio(e.objetivo)).toBe(true);
      expect(naoVazio(e.proximaAcao)).toBe(true);
    }
  });

  it("só o Micro-SPIN avança sem resposta, e tem a regra das 24h; as demais aguardam", () => {
    const semEspera = P.whatsapp.etapas.filter((e) => !e.aguardarResposta).map((e) => e.id);
    expect(semEspera).toEqual(["micro_spin"]);
    const spin = P.whatsapp.etapas.find((e) => e.id === "micro_spin")!;
    expect(spin.regraDeEspera).toMatch(/24h/);
  });

  it("a qualificação tem a tabela de condições (3 linhas) e a ponte para «já acompanha»", () => {
    const q = P.whatsapp.etapas.find((e) => e.id === "qualificacao")!;
    expect(q.condicoes).toHaveLength(3);
    expect(q.ponte?.id).toBe("whatsapp.qualificacao.ponte_ja_acompanha");
    expect(P.whatsapp.etapas.filter((e) => e.condicoes).map((e) => e.id)).toEqual(["qualificacao"]);
  });

  it("a abertura não pede reunião: nenhum placeholder de agenda", () => {
    const abertura = P.whatsapp.etapas[0]!;
    expect(tokensDoTexto(abertura.mensagem.texto)).toEqual(["Vendedor"]);
  });

  it("o convite pede DUAS opções de dia/hora", () => {
    const convite = P.whatsapp.etapas.find((e) => e.id === "convite")!;
    expect(convite.mensagem.texto.match(/\[dia\]/g)).toHaveLength(2);
    expect(convite.mensagem.texto.match(/\[hora\]/g)).toHaveLength(2);
  });

  it("os papéis do motor só apontam para etapas que o conteúdo tem copy", () => {
    const comCopy = new Set(P.whatsapp.etapas.map((e) => e.id as string)).add("pos_sim");
    for (const id of ["prospeccao", "conversa", "pre_venda", "reuniao_agendada"] as const) {
      for (const etapa of papel(id).etapas) expect(comCopy.has(etapa), `${id} → ${etapa}`).toBe(true);
    }
  });
});

describe("título e objetivo vêm do playbook, não do motor", () => {
  it("toda etapa da régua resolve no afb_comercial_v1 com título e objetivo", () => {
    for (const id of ETAPAS_IDS) {
      const r = etapaDoPlaybookComercial(P, id);
      expect(r, id).not.toBeNull();
      expect(r!.id).toBe(id);
      expect(r!.tipo).toBe(etapaEstrutural(id).tipo);
      expect(naoVazio(r!.titulo), id).toBe(true);
      expect(naoVazio(r!.objetivo), id).toBe(true);
      expect(metadadosDaEtapa(P, id)).toEqual({ titulo: r!.titulo, objetivo: r!.objetivo });
    }
  });

  it("sequência devolve a etapa de WhatsApp; pós-sim devolve a Etapa 7; follow_up devolve a CADÊNCIA", () => {
    const seq = etapaDoPlaybookComercial(P, "qualificacao");
    expect(seq?.tipo === "sequencia" && seq.etapa.mensagem.id).toBe("whatsapp.qualificacao");
    const pos = etapaDoPlaybookComercial(P, "pos_sim");
    expect(pos?.tipo === "pos_sim" && pos.etapa.confirmacao.id).toBe("pos_sim.confirmacao");
    const fu = etapaDoPlaybookComercial(P, "follow_up");
    expect(fu?.tipo === "follow_up" && fu.cadencia.toques.map((t) => t.dia)).toEqual([0, 1, 3, 5, 8, 12, 15]);
    expect(fu?.titulo).toBe("Cadência de follow-up");
  });

  it("follow_up é estrutural no motor e não tem copy única no conteúdo", () => {
    expect(etapaEstrutural("follow_up").tipo).toBe("follow_up");
    expect(P.whatsapp.etapas.some((e) => (e.id as string) === "follow_up")).toBe(false);
  });

  it("um playbook que não cubra uma etapa da sequência devolve null, sem inventar", () => {
    const parcial = { ...P, whatsapp: { ...P.whatsapp, etapas: P.whatsapp.etapas.slice(0, 2) } };
    expect(etapaDoPlaybookComercial(parcial, "convite")).toBeNull();
    expect(metadadosDaEtapa(parcial, "convite")).toBeNull();
    expect(etapaDoPlaybookComercial(parcial, "abertura")).not.toBeNull();
  });
});

describe("pós-sim (Etapa 7) e reunião", () => {
  it("tem confirmação, lembrete 24h, linha sem fatura e abertura com fatura", () => {
    const s = P.whatsapp.posSim;
    expect(s.ordem).toBe(7);
    expect(s.confirmacao.id).toBe("pos_sim.confirmacao");
    expect(s.lembrete24h.id).toBe("pos_sim.lembrete_24h");
    expect(s.aberturaComFatura.id).toBe("pos_sim.abertura_com_fatura");
    expect(naoVazio(s.lembreteSemFatura)).toBe(true);
    // A fatura é pedida AQUI, na confirmação — e em foto ou PDF.
    expect(s.confirmacao.texto).toMatch(/fatura/i);
    expect(s.confirmacao.texto).toMatch(/foto ou PDF/);
  });

  it("dois cenários de condução e as regras do achado único e do relatório", () => {
    expect(P.whatsapp.posSim.conducaoDaReuniao.map((c) => c.cenario)).toEqual([
      "A fatura chegou",
      "A fatura não chegou",
    ]);
    const regras = P.whatsapp.posSim.regras.join("\n");
    expect(regras).toMatch(/achado único/i);
    expect(regras).toMatch(/Apresentamos, não enviamos/);
  });
});

describe("cadência de follow-up (v6, 15 dias)", () => {
  const dias = P.followup.toques.map((t) => t.dia);

  it("segue exatamente os dias do novo HTML: D0 D1 D3 D5 D8 D12 D15", () => {
    expect(dias).toEqual([0, 1, 3, 5, 8, 12, 15]);
    expect(P.followup.cicloDias).toBe(15);
    expect(Math.max(...dias)).toBe(P.followup.cicloDias);
    expect(P.followup.reciclagemMeses).toBe(6);
  });

  it("não existe cadência antiga residual (D6, D9, D16, D20, quarto follow-up)", () => {
    for (const antigo of [6, 9, 16, 20]) expect(dias).not.toContain(antigo);
    expect(P.followup.toques.filter((t) => t.rotulo.startsWith("Follow-up"))).toHaveLength(3);
    expect(P.followup.toques.some((t) => /follow-up 4/i.test(t.rotulo))).toBe(false);
    expect(P.followup.toques.some((t) => /modalidade tarif/i.test(t.tema))).toBe(false);
  });

  it("rótulos, canais e temas como na tabela", () => {
    expect(P.followup.toques.map((t) => [t.rotulo, t.canal, t.tema])).toEqual([
      ["Abordagem inicial", "whatsapp_e_email", "Etapa 1"],
      ["Ligação 1", "telefone", "Roteiro de ligação, período da manhã"],
      ["Follow-up 1", "whatsapp_e_email", "Demanda contratada"],
      ["Ligação 2", "telefone", "Roteiro de ligação, período da tarde"],
      ["Follow-up 2", "whatsapp_e_email", "Energia reativa"],
      ["Follow-up 3", "email", "Ambiente de Contratação Livre"],
      ["Encerramento", "whatsapp_e_email", "Despedida"],
    ]);
  });

  it("as duas ligações alternam manhã e tarde e remetem ao roteiro; a abordagem remete à Etapa 1", () => {
    const ligacoes = P.followup.toques.filter((t) => t.canal === "telefone");
    expect(ligacoes.map((t) => t.periodo)).toEqual(["manha", "tarde"]);
    for (const l of ligacoes) {
      expect(l.remeteA).toBe("ligacao");
      expect(l.mensagem).toBeUndefined();
    }
    expect(P.followup.toques[0]!.remeteA).toBe("whatsapp.abertura");
  });

  it("os três follow-ups têm copy, levam case em PNG e o marcador está no texto; o encerramento tem copy sem case", () => {
    const fus = P.followup.toques.filter((t) => t.rotulo.startsWith("Follow-up"));
    for (const fu of fus) {
      expect(fu.anexo).toBe("case_png");
      expect(fu.mensagem?.texto).toContain("[INSERIR CASE DE ECONOMIA — PNG]");
    }
    const fim = P.followup.toques.at(-1)!;
    expect(fim.rotulo).toBe("Encerramento");
    expect(naoVazio(fim.mensagem?.texto)).toBe(true);
    expect(fim.anexo).toBeUndefined();
  });

  it("resposta interrompe e devolve às Etapas 2 a 6; «sem oitavo toque» e horários estão nas regras", () => {
    expect(P.followup.respostaInterrompe).toBe(true);
    expect(P.followup.aoResponder).toMatch(/Etapas 2 a 6/);
    const regras = P.followup.regras.join("\n");
    expect(regras).toMatch(/Não existe oitavo toque/);
    expect(regras).toMatch(/8h30 às 11h ou 14h às 17h/);
    expect(regras).toMatch(/Depois do D15/);
  });

  it("ids dos toques são únicos e carregam o dia", () => {
    const ids = P.followup.toques.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of P.followup.toques) expect(t.id).toContain(`.d${t.dia}.`);
  });

  it("o motor genérico opera esta cadência: próximo toque, encerramento e janela vêm DAQUI", () => {
    expect(proximoToque(P.followup, 4)?.id).toBe("followup.d5.ligacao_2");
    expect(proximoToque(P.followup, 12)?.id).toBe("followup.d12.contratacao_livre");
    expect(ultimoToque(P.followup)?.dia).toBe(15);
    expect(cadenciaEncerrada(P.followup, 15)).toBe(false);
    expect(cadenciaEncerrada(P.followup, 16)).toBe(true);
    // A janela do playbook: 8h30–11h / 14h–17h, dias úteis, seg-manhã e sex-tarde desaconselhados.
    expect(janelaDoToque(P.followup.janela, 2, 9, 0)).toBe("permitido");
    expect(janelaDoToque(P.followup.janela, 1, 9, 0)).toBe("desaconselhado");
    expect(janelaDoToque(P.followup.janela, 5, 15, 0)).toBe("desaconselhado");
    expect(janelaDoToque(P.followup.janela, 6, 9, 0)).toBe("fora_da_janela");
    expect(janelaDoToque(P.followup.janela, 2, 18, 30)).toBe("fora_da_janela");
  });
});

describe("e-mail de abertura", () => {
  it("tem exatamente as três variações, nesta ordem: financeira, curiosidade, consultiva", () => {
    expect(P.email.variacoes.map((v) => v.id)).toEqual(["financeira", "curiosidade", "consultiva"]);
    expect(P.email.variacoes.map((v) => v.rotulo)).toEqual(["A · Financeira", "B · Curiosidade", "C · Consultiva"]);
  });

  it("cada variação tem assunto, corpo em canal e-mail, quando usar e placeholders", () => {
    for (const v of P.email.variacoes) {
      expect(naoVazio(v.assunto)).toBe(true);
      expect(v.corpo.canal).toBe("email");
      expect(v.corpo.id).toBe(`email.${v.id}`);
      expect(naoVazio(v.corpo.texto)).toBe(true);
      expect(naoVazio(v.quandoUsar)).toBe(true);
      expect(tokensDoTexto(v.corpo.texto)).toEqual(expect.arrayContaining(["Nome", "Vendedor", "Empresa", "Assinatura"]));
    }
  });

  it("nenhum assunto traz percentual, cifrão ou a palavra «economia» — a regra do próprio playbook", () => {
    for (const v of P.email.variacoes) {
      expect(v.assunto).not.toMatch(/%|R\$|\$|economia/i);
    }
  });

  it("as variações A/B/C são só do e-mail: o WhatsApp não tem nada parecido", () => {
    for (const e of P.whatsapp.etapas) expect("variacoes" in e).toBe(false);
  });
});

describe("roteiro de ligação", () => {
  it("tem os seis blocos, todos em canal telefone", () => {
    const l = P.ligacao;
    for (const m of [l.recepcao, l.doQueSeTrata, l.aberturaComDecisor, l.fechamentoDeAgenda, l.caixaPostal]) {
      expect(m.canal).toBe("telefone");
      expect(naoVazio(m.texto)).toBe(true);
    }
    expect(l.perguntasDeDiagnostico).toHaveLength(3);
    expect(l.naRecepcaoNunca).toHaveLength(3);
  });

  it("a abertura com o decisor preserva a pausa como instrução no texto", () => {
    expect(P.ligacao.aberturaComDecisor.texto).toContain("[pausa — esperar a resposta]");
    expect(P.ligacao.instrucaoDaAbertura).toMatch(/pare de falar/);
  });

  it("o fechamento de agenda oferece dois horários (em caixa alta, como no roteiro)", () => {
    expect(P.ligacao.fechamentoDeAgenda.texto.match(/\[DIA\]/g)).toHaveLength(2);
    expect(P.ligacao.fechamentoDeAgenda.texto.match(/\[HORA\]/g)).toHaveLength(2);
  });
});

describe("objeções", () => {
  it("são 11, com ids únicos e todas as partes obrigatórias", () => {
    expect(P.objecoes).toHaveLength(11);
    const ids = P.objecoes.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const o of P.objecoes) {
      expect(o.id).toMatch(/^[a-z_]+$/);
      expect(naoVazio(o.gatilho)).toBe(true);
      expect(naoVazio(o.porTras)).toBe(true);
      expect(naoVazio(o.resposta.texto)).toBe(true);
      expect(o.resposta.id).toBe(`objecao.${o.id}`);
    }
  });

  it("lista as objeções do documento, na ordem", () => {
    expect(P.objecoes.map((o) => o.id)).toEqual([
      "energia_solar",
      "quanto_custa",
      "ja_temos_consultoria",
      "preso_em_contrato",
      "trocar_distribuidora",
      "sem_tempo",
      "falar_com_socio",
      "sem_interesse",
      "acesso_a_conta",
      "mais_informacao_por_escrito",
      "nao_sou_eu",
    ]);
  });

  it("«sem interesse» carrega a observação de saída e encerra a cadência", () => {
    const o = P.objecoes.find((x) => x.id === "sem_interesse")!;
    expect(o.observacao).toMatch(/revisamos ano passado/);
    expect(o.proximaAcao).toMatch(/encerra a cadência/);
  });
});

describe("guardrails", () => {
  it("ids únicos, com prefixo de severidade coerente", () => {
    const ids = P.guardrails.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of P.guardrails) {
      expect(g.id.startsWith(`${g.severidade}.`) || (g.severidade === "regra" && g.id.startsWith("principio."))).toBe(true);
      expect(naoVazio(g.regra)).toBe(true);
      expect(naoVazio(g.origem)).toBe(true);
    }
  });

  it("os 13 itens de «O que nunca dizer» estão registrados", () => {
    expect(P.guardrails.filter((g) => g.severidade === "nunca")).toHaveLength(13);
  });

  it("os 9 princípios estão registrados como guardrails", () => {
    expect(P.guardrails.filter((g) => g.id.startsWith("principio."))).toHaveLength(9);
  });

  it("as regras principais existem por id", () => {
    const ids = new Set(P.guardrails.map((g) => g.id));
    for (const id of [
      "regra.conversa_nao_disparo",
      "regra.enviar_e_esperar",
      "regra.uma_pergunta_so",
      "regra.duas_opcoes_de_horario",
      "regra.relatorio_apresentado_nao_enviado",
      "regra.achado_unico",
      "regra.resposta_encerra_cadencia",
      "regra.sem_oitavo_toque",
      "regra.janela_de_horarios",
      "regra.case_real_ou_nenhum",
      "regra.mercado_livre_so_para_elegiveis",
      "regra.assunto_de_email",
      "regra.na_recepcao_nunca",
      "nunca.emoji",
      "nunca.audio_no_primeiro_contato",
      "nunca.puxar_solar",
      "nunca.credenciado_pela_distribuidora",
      "atencao.afirmacao_categorica_kwh",
      "atencao.trocar_distribuidora",
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it("toda categoria do vocabulário pedido tem pelo menos um guardrail", () => {
    const categorias = new Set(P.guardrails.map((g) => g.categoria));
    for (const c of [
      "promessas", "cta", "energia_solar", "distribuidora", "fatura", "subestacao", "emojis", "audio",
      "sequencia_de_mensagens", "relatorio", "cases", "mercado_livre", "horarios",
    ] as const) {
      expect(categorias.has(c), c).toBe(true);
    }
  });

  it("toda referência de guardrail feita por uma etapa resolve para um guardrail existente", () => {
    const ids = new Set(P.guardrails.map((g) => g.id));
    for (const e of P.whatsapp.etapas) for (const ref of e.guardrails) expect(ids.has(ref), `${e.id} → ${ref}`).toBe(true);
  });
});

describe("placeholders", () => {
  it("todo [token] usado em qualquer copy está no catálogo do playbook", () => {
    const desconhecidos: string[] = [];
    for (const m of todasAsMensagens(P)) {
      for (const { token, placeholder } of placeholdersDaMensagem(P, m)) {
        if (!placeholder) desconhecidos.push(`${m.id}: [${token}]`);
      }
    }
    // Também nos assuntos de e-mail, que não são Mensagem.
    const conhecidos = new Set(P.placeholders.map((p) => p.token));
    for (const v of P.email.variacoes) for (const t of tokensDoTexto(v.assunto)) if (!conhecidos.has(t)) desconhecidos.push(`assunto ${v.id}: [${t}]`);
    expect(desconhecidos).toEqual([]);
  });

  it("todo placeholder do catálogo é usado em alguma copy (sem entrada morta)", () => {
    const usados = new Set<string>();
    for (const m of todasAsMensagens(P)) for (const t of tokensDoTexto(m.texto)) usados.add(t);
    for (const v of P.email.variacoes) for (const t of tokensDoTexto(v.assunto)) usados.add(t);
    for (const p of P.placeholders) expect(usados.has(p.token), p.token).toBe(true);
  });

  it("os placeholders da tabela do documento estão catalogados; os equivalentes apontam para um canônico", () => {
    const porToken = new Map(P.placeholders.map((p) => [p.token, p]));
    for (const t of ["Nome", "Vendedor", "Empresa", "dia", "hora"]) expect(porToken.has(t)).toBe(true);
    for (const p of P.placeholders) if (p.equivaleA) expect(porToken.has(p.equivaleA)).toBe(true);
    expect(porToken.get("INSERIR CASE DE ECONOMIA — PNG")?.tipo).toBe("anexo");
    expect(porToken.get("pausa — esperar a resposta")?.tipo).toBe("instrucao");
  });
});

describe("mensagens", () => {
  it("nenhuma copy principal está vazia e todos os ids de mensagem são únicos", () => {
    const todas = todasAsMensagens(P);
    expect(todas.length).toBeGreaterThanOrEqual(6 + 1 + 3 + 4 + 3 + 5 + 11);
    for (const m of todas) expect(naoVazio(m.texto), m.id).toBe(true);
    const ids = todas.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("nenhuma copy carrega emoji — «O que nunca dizer»", () => {
    for (const m of todasAsMensagens(P)) expect(m.texto, m.id).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

describe("métricas e pendências", () => {
  it("5 indicadores e 2 itens em desenvolvimento", () => {
    expect(P.metricas.map((m) => m.indicador)).toEqual([
      "Taxa de resposta",
      "Avanço na sequência",
      "Taxa de agendamento",
      "Captação da fatura",
      "Comparecimento",
    ]);
    expect(P.emDesenvolvimento).toHaveLength(2);
  });
});
