import { describe, expect, it } from "vitest";

import {
  ETAPAS_DO_PLAYBOOK,
  ETAPAS_IDS,
  ehEtapaId,
  etapaDoPlaybook,
  proximaEtapaDaSequencia,
} from "./etapas";

describe("ETAPAS_DO_PLAYBOOK", () => {
  it("tem exatamente as 8 etapas do playbook, uma por id, na ordem 1..8", () => {
    expect(ETAPAS_DO_PLAYBOOK.map((e) => e.id)).toEqual([...ETAPAS_IDS]);
    expect(ETAPAS_DO_PLAYBOOK.map((e) => e.ordem)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("a sequência são as seis primeiras; pós-sim e follow-up ficam fora dela", () => {
    const sequencia = ETAPAS_DO_PLAYBOOK.filter((e) => e.tipo === "sequencia").map((e) => e.id);
    expect(sequencia).toEqual([
      "abertura",
      "qualificacao",
      "gancho_de_valor",
      "desarme_de_risco",
      "micro_spin",
      "convite",
    ]);
    expect(etapaDoPlaybook("pos_sim").tipo).toBe("pos_sim");
    expect(etapaDoPlaybook("follow_up").tipo).toBe("follow_up");
  });

  it("só o Micro-SPIN avança sem resposta dentro da sequência (regra das 24h)", () => {
    const semResposta = ETAPAS_DO_PLAYBOOK.filter(
      (e) => e.tipo === "sequencia" && !e.exigeRespostaAntesDeAvancar,
    ).map((e) => e.id);
    expect(semResposta).toEqual(["micro_spin"]);
  });

  it("convite e pós-sim são as etapas de reunião; follow-up é a única de follow-up", () => {
    expect(ETAPAS_DO_PLAYBOOK.filter((e) => e.ehReuniao).map((e) => e.id)).toEqual([
      "convite",
      "pos_sim",
    ]);
    expect(ETAPAS_DO_PLAYBOOK.filter((e) => e.ehFollowUp).map((e) => e.id)).toEqual(["follow_up"]);
  });

  it("toda etapa tem mensagem de WhatsApp e um objetivo escrito", () => {
    for (const e of ETAPAS_DO_PLAYBOOK) {
      expect(e.permiteMensagem).toBe(true);
      expect(e.objetivo.length).toBeGreaterThan(10);
    }
  });
});

describe("ehEtapaId", () => {
  it("aceita só os ids do playbook", () => {
    expect(ehEtapaId("abertura")).toBe(true);
    expect(ehEtapaId("Abertura")).toBe(false);
    expect(ehEtapaId("sem_contato")).toBe(false);
    expect(ehEtapaId(1)).toBe(false);
    expect(ehEtapaId(null)).toBe(false);
  });
});

describe("proximaEtapaDaSequencia", () => {
  it("anda a sequência e para no convite", () => {
    expect(proximaEtapaDaSequencia("abertura")).toBe("qualificacao");
    expect(proximaEtapaDaSequencia("micro_spin")).toBe("convite");
    expect(proximaEtapaDaSequencia("convite")).toBeNull();
  });

  it("fora da sequência não há próxima", () => {
    expect(proximaEtapaDaSequencia("pos_sim")).toBeNull();
    expect(proximaEtapaDaSequencia("follow_up")).toBeNull();
  });
});
