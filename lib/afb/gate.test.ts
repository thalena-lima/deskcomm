import { describe, expect, it } from "vitest";

import { modulosDeFunilSchema } from "@/lib/schemas/settings";

import {
  copilotoComercialAtivo,
  copilotoTemPlaybookValido,
  estadoDoCopiloto,
  MODULO_COPILOTO_COMERCIAL,
  playbookDoPipeline,
} from "./gate";

const LIGADO_COM_PLAYBOOK = {
  modulos: { copiloto_comercial: { enabled: true, playbook_id: "afb_comercial_v1", etapas: {} } },
};

describe("copilotoComercialAtivo", () => {
  it("liga só com settings.modulos.copiloto_comercial.enabled === true", () => {
    expect(copilotoComercialAtivo({ modulos: { copiloto_comercial: { enabled: true } } })).toBe(true);
    expect(copilotoComercialAtivo({ modulos: { copiloto_comercial: { enabled: false } } })).toBe(false);
  });

  it("fica desligado com settings ausente, vazio ou malformado", () => {
    expect(copilotoComercialAtivo(null)).toBe(false);
    expect(copilotoComercialAtivo(undefined)).toBe(false);
    expect(copilotoComercialAtivo({})).toBe(false);
    expect(copilotoComercialAtivo({ modulos: [] })).toBe(false);
    expect(copilotoComercialAtivo({ modulos: { copiloto_comercial: { enabled: "true" } } })).toBe(false);
    expect(copilotoComercialAtivo({ modulos: { copiloto_comercial: true } })).toBe(false);
  });

  it("não é enganado por outro módulo ligado", () => {
    expect(copilotoComercialAtivo({ modulos: { outro: { enabled: true } } })).toBe(false);
  });

  it("a chave que o gate lê é a mesma que o schema de escrita aceita", () => {
    const r = modulosDeFunilSchema.safeParse({ [MODULO_COPILOTO_COMERCIAL]: { enabled: true } });
    expect(r.success).toBe(true);
  });
});

describe("playbookDoPipeline / copilotoTemPlaybookValido", () => {
  it("resolve o id gravado no registry", () => {
    expect(playbookDoPipeline(LIGADO_COM_PLAYBOOK)?.id).toBe("afb_comercial_v1");
    expect(copilotoTemPlaybookValido(LIGADO_COM_PLAYBOOK)).toBe(true);
  });

  it("id desconhecido, ausente, null ou malformado → null, sem lançar e SEM inventar", () => {
    for (const modulo of [
      { enabled: true },
      { enabled: true, playbook_id: null },
      { enabled: true, playbook_id: "afb_comercial_v9" },
      { enabled: true, playbook_id: "Comercial AFB" },
      { enabled: true, playbook_id: 7 },
    ]) {
      const s = { modulos: { copiloto_comercial: modulo } };
      expect(() => playbookDoPipeline(s)).not.toThrow();
      expect(playbookDoPipeline(s)).toBeNull();
      expect(copilotoTemPlaybookValido(s)).toBe(false);
    }
    expect(playbookDoPipeline(null)).toBeNull();
  });

  it("não olha enabled: playbook válido num módulo desligado ainda resolve", () => {
    expect(
      copilotoTemPlaybookValido({ modulos: { copiloto_comercial: { enabled: false, playbook_id: "afb_comercial_v1" } } }),
    ).toBe(true);
  });
});

describe("estadoDoCopiloto — o estado é explícito", () => {
  it("desligado", () => {
    expect(estadoDoCopiloto(null)).toEqual({ estado: "desligado" });
    expect(
      estadoDoCopiloto({ modulos: { copiloto_comercial: { enabled: false, playbook_id: "afb_comercial_v1" } } }),
    ).toEqual({ estado: "desligado" });
  });

  it("ligado sem playbook_id (legado) → sem_playbook, NUNCA afb_comercial_v1 por baixo dos panos", () => {
    expect(estadoDoCopiloto({ modulos: { copiloto_comercial: { enabled: true } } })).toEqual({ estado: "sem_playbook" });
    expect(estadoDoCopiloto({ modulos: { copiloto_comercial: { enabled: true, playbook_id: null } } })).toEqual({
      estado: "sem_playbook",
    });
  });

  it("ligado com id que o registry não conhece → playbook_desconhecido, com o id para a tela dizer", () => {
    expect(
      estadoDoCopiloto({ modulos: { copiloto_comercial: { enabled: true, playbook_id: "afb_prospeccao_v1" } } }),
    ).toEqual({ estado: "playbook_desconhecido", playbookId: "afb_prospeccao_v1" });
    // Forma inválida nem chega a ser "id": é sem_playbook.
    expect(
      estadoDoCopiloto({ modulos: { copiloto_comercial: { enabled: true, playbook_id: "Comercial AFB" } } }),
    ).toEqual({ estado: "sem_playbook" });
  });

  it("ligado com playbook registrado → pronto, com o playbook", () => {
    const r = estadoDoCopiloto(LIGADO_COM_PLAYBOOK);
    expect(r.estado).toBe("pronto");
    expect(r.estado === "pronto" && r.playbook.id).toBe("afb_comercial_v1");
  });
});
