import { describe, expect, it } from "vitest";

import { CAMPOS_DO_COPILOTO, CAMPOS_GRAVAVEIS, ESTATUTO_DOS_CAMPOS, ehStatusDeFollowUp } from "./campos";

describe("CAMPOS_DO_COPILOTO", () => {
  it("cada constante é igual à própria chave — é o nome do custom field no jsonb", () => {
    for (const [chave, valor] of Object.entries(CAMPOS_DO_COPILOTO)) expect(valor).toBe(chave);
  });

  it("todo campo tem estatuto declarado", () => {
    expect(Object.keys(ESTATUTO_DOS_CAMPOS).sort()).toEqual(Object.keys(CAMPOS_DO_COPILOTO).sort());
  });

  it("os derivados do calendário e da conversa são calculados, e o copiloto não os grava", () => {
    expect(ESTATUTO_DOS_CAMPOS.dia_cadencia).toBe("calculado");
    expect(ESTATUTO_DOS_CAMPOS.proximo_followup).toBe("calculado");
    expect(ESTATUTO_DOS_CAMPOS.ultimo_contato).toBe("calculado");
    expect(CAMPOS_GRAVAVEIS).not.toContain("dia_cadencia");
    expect(CAMPOS_GRAVAVEIS).not.toContain("proximo_followup");
    expect(CAMPOS_GRAVAVEIS).not.toContain("ultimo_contato");
  });

  it("posição, variação, perfil, status e âncora da cadência são fonte", () => {
    expect(CAMPOS_GRAVAVEIS).toEqual([
      "etapa_playbook",
      "variacao_abordagem",
      "perfil_interlocutor",
      "status_followup",
      "inicio_cadencia",
    ]);
  });
});

describe("ehStatusDeFollowUp", () => {
  it("aceita só o vocabulário fechado", () => {
    expect(ehStatusDeFollowUp("ativa")).toBe(true);
    expect(ehStatusDeFollowUp("encerrada")).toBe(true);
    expect(ehStatusDeFollowUp("Ativa")).toBe(false);
    expect(ehStatusDeFollowUp("em_andamento")).toBe(false);
    expect(ehStatusDeFollowUp(null)).toBe(false);
  });
});
