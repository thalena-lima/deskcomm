import { describe, expect, it } from "vitest";

import { ehPlaybookId, PLAYBOOK_IDS } from "./catalogo";
import { getPlaybook, listarPlaybooks, tokensDoTexto } from "./registry";

describe("registry", () => {
  it("encontra afb_comercial_v1 e o devolve tipado", () => {
    const p = getPlaybook("afb_comercial_v1");
    expect(p).not.toBeNull();
    expect(p?.id).toBe("afb_comercial_v1");
    expect(p?.versaoDoDocumento).toBe("Versão 6");
  });

  it("playbook inexistente devolve null, sem lançar — para id torto, null, undefined, número", () => {
    for (const id of ["afb_comercial_v9", "", null, undefined, 42, {}]) {
      expect(() => getPlaybook(id as never)).not.toThrow();
      expect(getPlaybook(id as never)).toBeNull();
    }
  });

  it("ids são únicos e versionados (`_v<n>`), e o registry lista exatamente eles", () => {
    expect(new Set(PLAYBOOK_IDS).size).toBe(PLAYBOOK_IDS.length);
    for (const id of PLAYBOOK_IDS) expect(id).toMatch(/^[a-z0-9_]+_v\d+$/);
    expect(listarPlaybooks().map((p) => p.id)).toEqual([...PLAYBOOK_IDS]);
    expect(ehPlaybookId("afb_comercial_v1")).toBe(true);
    expect(ehPlaybookId("Comercial AFB")).toBe(false);
  });

  it("o id do playbook NÃO é nome de funil", () => {
    for (const id of PLAYBOOK_IDS) expect(id).not.toMatch(/\s|[A-Z]/);
  });

  it("tokensDoTexto extrai placeholders sem colchetes, sem repetição, na ordem", () => {
    expect(tokensDoTexto("Olá [Nome], [dia] às [hora] ou [dia] às [hora]. [X] kW")).toEqual([
      "Nome",
      "dia",
      "hora",
      "X",
    ]);
    expect(tokensDoTexto("sem placeholder")).toEqual([]);
  });
});
