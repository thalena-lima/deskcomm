/**
 * O catálogo é identidade LEVE — e a direção dos imports é o que o mantém leve.
 *
 * Duas famílias de caso: (1) o catálogo e o registry dizem a mesma coisa sobre
 * quais playbooks existem e como se chamam; (2) quem só precisa de identidade
 * (schema, tela de funis, o próprio catálogo) NÃO importa o conteúdo. A
 * segunda é provada lendo o código-fonte: sem tooling, um `readFileSync` e um
 * regex sobre os `import` bastam, e reprova no dia em que alguém "só" importar
 * `getPlaybook` no schema para uma validação a mais.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CATALOGO_PLAYBOOKS,
  ehPlaybookId,
  listarMetadadosDePlaybooks,
  metadadosDoPlaybook,
  PLAYBOOK_IDS,
} from "./catalogo";
import { getPlaybook, listarPlaybooks } from "./registry";

const RAIZ = join(__dirname, "..", "..", "..");

/** Os módulos que um import do arquivo alcança — só a linha de `import`, sem resolver. */
function importsDe(caminho: string): string[] {
  const fonte = readFileSync(join(RAIZ, caminho), "utf8");
  return [...fonte.matchAll(/^\s*(?:import|export)\b[^;]*?\bfrom\s+["']([^"']+)["']/gm)].map((m) => m[1]!);
}

describe("catálogo", () => {
  it("contém afb_comercial_v1 com nome e versão do documento", () => {
    expect(ehPlaybookId("afb_comercial_v1")).toBe(true);
    expect(metadadosDoPlaybook("afb_comercial_v1")).toEqual({
      id: "afb_comercial_v1",
      nome: "Playbook Comercial — Consultoria em Energia",
      versaoDoDocumento: "Versão 6",
      descricao: expect.any(String),
    });
  });

  it("ids são únicos, versionados e em snake_case; nada de nome de funil", () => {
    expect(new Set(PLAYBOOK_IDS).size).toBe(PLAYBOOK_IDS.length);
    for (const id of PLAYBOOK_IDS) expect(id).toMatch(/^[a-z0-9_]+_v\d+$/);
    expect(listarMetadadosDePlaybooks()).toBe(CATALOGO_PLAYBOOKS);
  });

  it("id desconhecido, null, número → false / null, sem lançar", () => {
    for (const v of ["afb_comercial_v9", "Comercial AFB", "", null, undefined, 1, {}]) {
      expect(ehPlaybookId(v)).toBe(false);
      expect(metadadosDoPlaybook(v as never)).toBeNull();
    }
  });

  it("só carrega metadados: nenhuma entrada tem copy, etapas, objeções ou cadência", () => {
    for (const p of CATALOGO_PLAYBOOKS) {
      expect(Object.keys(p).sort()).toEqual(["descricao", "id", "nome", "versaoDoDocumento"]);
      expect(p.descricao.length).toBeLessThan(300);
    }
  });
});

describe("catálogo ↔ registry, sincronizados", () => {
  it("todo id do catálogo tem conteúdo no registry, e todo playbook do registry está no catálogo", () => {
    for (const id of PLAYBOOK_IDS) expect(getPlaybook(id), id).not.toBeNull();
    expect(listarPlaybooks().map((p) => p.id).sort()).toEqual([...PLAYBOOK_IDS].sort());
  });

  it("nome e versão do documento batem entre catálogo e conteúdo", () => {
    for (const meta of CATALOGO_PLAYBOOKS) {
      const p = getPlaybook(meta.id)!;
      expect(p.nome).toBe(meta.nome);
      expect(p.versaoDoDocumento).toBe(meta.versaoDoDocumento);
    }
  });

  it("getPlaybook continua devolvendo o conteúdo completo", () => {
    const p = getPlaybook("afb_comercial_v1")!;
    expect(p.whatsapp.etapas.length).toBeGreaterThan(0);
    expect(p.objecoes.length).toBeGreaterThan(0);
    expect(p.followup.toques.length).toBeGreaterThan(0);
  });
});

describe("direção dos imports — identidade nunca puxa conteúdo", () => {
  const PROIBIDOS_PARA_IDENTIDADE = [/playbooks\/registry/, /playbooks\/comercial/, /\.\/registry$/, /\.\/comercial/];

  it("catalogo.ts não importa registry nem conteúdo", () => {
    const imports = importsDe("lib/afb/playbooks/catalogo.ts");
    for (const i of imports) for (const p of PROIBIDOS_PARA_IDENTIDADE) expect(i, i).not.toMatch(p);
  });

  it("lib/schemas/settings.ts valida playbook_id pelo catálogo e não importa registry nem conteúdo", () => {
    const imports = importsDe("lib/schemas/settings.ts");
    expect(imports).toContain("@/lib/afb/playbooks/catalogo");
    for (const i of imports) for (const p of PROIBIDOS_PARA_IDENTIDADE) expect(i, i).not.toMatch(p);
  });

  it("a tela de funis monta o seletor pelo catálogo e não importa registry nem conteúdo", () => {
    const imports = importsDe("app/app/settings/tenant/pipelines/_client.tsx");
    expect(imports).toContain("@/lib/afb/playbooks/catalogo");
    for (const i of imports) for (const p of PROIBIDOS_PARA_IDENTIDADE) expect(i, i).not.toMatch(p);
  });

  it("o registry é quem importa o conteúdo — e importa o catálogo, não o contrário", () => {
    const imports = importsDe("lib/afb/playbooks/registry.ts");
    expect(imports).toContain("./comercial");
    expect(imports).toContain("./catalogo");
  });
});
