/**
 * A régua de etapas — só estrutura. Se algum caso aqui precisar de título,
 * objetivo ou copy, é sinal de que conteúdo voltou para o motor.
 */
import { describe, expect, it } from "vitest";

import {
  ETAPAS_ESTRUTURAIS,
  ETAPAS_IDS,
  SEQUENCIA_IDS,
  ehEtapaDaSequencia,
  ehEtapaId,
  etapaAnteriorDaSequencia,
  etapaEstrutural,
  proximaEtapaDaSequencia,
} from "./etapas";

describe("ETAPAS_ESTRUTURAIS", () => {
  it("os ids são exatamente estes, nesta ordem — a ponte com papéis, mapeamento e playbook", () => {
    expect([...ETAPAS_IDS]).toEqual([
      "abertura",
      "qualificacao",
      "gancho_de_valor",
      "desarme_de_risco",
      "micro_spin",
      "convite",
      "pos_sim",
      "follow_up",
    ]);
    expect(ETAPAS_ESTRUTURAIS.map((e) => e.id)).toEqual([...ETAPAS_IDS]);
    expect(ETAPAS_ESTRUTURAIS.map((e) => e.ordem)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("seis de sequência, uma de pós-sim, uma de follow-up", () => {
    expect(SEQUENCIA_IDS).toEqual([
      "abertura",
      "qualificacao",
      "gancho_de_valor",
      "desarme_de_risco",
      "micro_spin",
      "convite",
    ]);
    expect(etapaEstrutural("pos_sim").tipo).toBe("pos_sim");
    expect(etapaEstrutural("follow_up").tipo).toBe("follow_up");
    expect(ehEtapaDaSequencia("convite")).toBe(true);
    expect(ehEtapaDaSequencia("follow_up")).toBe(false);
  });

  it("nenhuma etapa estrutural carrega título, objetivo, copy ou regra comercial", () => {
    for (const e of ETAPAS_ESTRUTURAIS) {
      expect(Object.keys(e).sort()).toEqual(["id", "ordem", "tipo"]);
    }
  });
});

describe("ehEtapaId", () => {
  it("aceita só os ids da régua", () => {
    expect(ehEtapaId("abertura")).toBe(true);
    expect(ehEtapaId("Abertura")).toBe(false);
    expect(ehEtapaId("sem_contato")).toBe(false);
    expect(ehEtapaId(1)).toBe(false);
    expect(ehEtapaId(null)).toBe(false);
  });
});

describe("navegação na sequência", () => {
  it("próxima anda a sequência e para no convite", () => {
    expect(proximaEtapaDaSequencia("abertura")).toBe("qualificacao");
    expect(proximaEtapaDaSequencia("micro_spin")).toBe("convite");
    expect(proximaEtapaDaSequencia("convite")).toBeNull();
  });

  it("anterior volta a sequência e para na abertura", () => {
    expect(etapaAnteriorDaSequencia("convite")).toBe("micro_spin");
    expect(etapaAnteriorDaSequencia("qualificacao")).toBe("abertura");
    expect(etapaAnteriorDaSequencia("abertura")).toBeNull();
  });

  it("fora da sequência não há próxima nem anterior", () => {
    for (const id of ["pos_sim", "follow_up"] as const) {
      expect(proximaEtapaDaSequencia(id)).toBeNull();
      expect(etapaAnteriorDaSequencia(id)).toBeNull();
    }
  });

  it("próxima e anterior são inversas dentro da sequência", () => {
    for (const id of SEQUENCIA_IDS) {
      const prox = proximaEtapaDaSequencia(id);
      if (prox) expect(etapaAnteriorDaSequencia(prox)).toBe(id);
    }
  });
});
