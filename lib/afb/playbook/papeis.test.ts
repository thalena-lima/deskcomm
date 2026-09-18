import { describe, expect, it } from "vitest";

import { PAPEIS_CONFIGURAVEIS_DA_ETAPA_DO_FUNIL, PAPEIS_DE_ETAPA_DO_FUNIL } from "@/lib/schemas/settings";

import { ETAPAS_IDS, etapaDoPlaybook } from "./etapas";
import { PAPEIS_CONFIGURAVEIS, PAPEIS_DE_ETAPA, PAPEIS_IDS, PAPEIS_TERMINAIS, ehPapelConfiguravel, ehPapelId, papel } from "./papeis";

describe("PAPEIS_DE_ETAPA", () => {
  it("cobre todos os ids, sem repetição — e os ids são o vocabulário do core", () => {
    expect(PAPEIS_DE_ETAPA.map((p) => p.id)).toEqual([...PAPEIS_IDS]);
    // Se o schema de escrita ganhar um papel e este arquivo não, o admin
    // consegue gravar um papel que a leitura não sabe o que é.
    expect([...PAPEIS_IDS]).toEqual([...PAPEIS_DE_ETAPA_DO_FUNIL]);
  });

  it("toda etapa da SEQUÊNCIA e do pós-sim cabe em algum papel; o follow-up é estado paralelo", () => {
    const cobertas = new Set(PAPEIS_DE_ETAPA.flatMap((p) => p.etapas));
    for (const id of ETAPAS_IDS) {
      if (id === "follow_up") expect(cobertas.has(id)).toBe(false);
      else expect(cobertas.has(id), `etapa «${id}» não cabe em papel nenhum`).toBe(true);
    }
  });

  it("toda etapa referida por um papel existe no playbook", () => {
    for (const p of PAPEIS_DE_ETAPA) for (const e of p.etapas) expect(etapaDoPlaybook(e).id).toBe(e);
  });

  it("uma coluna pode abrigar várias etapas: «conversa» vai da qualificação ao convite, em ordem", () => {
    expect(papel("conversa").etapas).toEqual([
      "qualificacao",
      "gancho_de_valor",
      "desarme_de_risco",
      "micro_spin",
      "convite",
    ]);
  });

  it("apresentação, fechamento e pós-venda não têm etapa de WhatsApp", () => {
    for (const id of ["apresentacao", "fechamento", "pos_venda"] as const) {
      expect(papel(id).etapas).toEqual([]);
      expect(papel(id).followUpPermitido).toBe(false);
    }
  });

  it("follow-up só corre em prospecção, conversa e pré-venda", () => {
    expect(PAPEIS_DE_ETAPA.filter((p) => p.followUpPermitido).map((p) => p.id)).toEqual([
      "prospeccao",
      "conversa",
      "pre_venda",
    ]);
  });

  it("ganho e perdido são os únicos terminais, sem etapa de WhatsApp, e NÃO são configuráveis", () => {
    expect(PAPEIS_DE_ETAPA.filter((p) => p.terminal).map((p) => p.id)).toEqual([...PAPEIS_TERMINAIS]);
    for (const id of PAPEIS_TERMINAIS) {
      expect(papel(id).etapas).toEqual([]);
      expect(ehPapelConfiguravel(id)).toBe(false);
    }
    // Os dois conjuntos são complementares e o flag `terminal` acompanha.
    expect([...PAPEIS_CONFIGURAVEIS]).toEqual([...PAPEIS_CONFIGURAVEIS_DA_ETAPA_DO_FUNIL]);
    expect(PAPEIS_DE_ETAPA.filter((p) => !p.terminal).map((p) => p.id)).toEqual([...PAPEIS_CONFIGURAVEIS]);
  });

  it("ehPapelId aceita o vocabulário inteiro e recusa nome de coluna, maiúscula e tipo errado", () => {
    for (const id of PAPEIS_IDS) expect(ehPapelId(id)).toBe(true);
    expect(ehPapelId("Contato Feito")).toBe(false);
    expect(ehPapelId("Conversa")).toBe(false);
    expect(ehPapelId(2)).toBe(false);
    expect(ehPapelId(null)).toBe(false);
  });
});
