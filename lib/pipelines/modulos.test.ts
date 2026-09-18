/**
 * Leitor e merge de módulos por funil.
 *
 * Os defeitos que este arquivo existe para tornar impossíveis:
 *
 *   1. LEITURA CRÉDULA — `settings` chega de cinco leitores sem validação; se
 *      o leitor aceitasse `"true"` ou `1`, um jsonb mexido à mão ligaria um
 *      módulo que ninguém ligou.
 *   2. MERGE RASO NO SEGUNDO NÍVEL — atribuir `patch.modulos` inteiro apaga os
 *      módulos que o patch não citou. Com um módulo só o bug não aparece; o
 *      caso "módulo existente não é apagado ao atualizar outro" o pega ANTES
 *      do segundo módulo existir.
 *   3. MERGE RASO NO TERCEIRO NÍVEL — substituir o módulo inteiro faz o
 *      interruptor (`{ enabled }`) apagar o mapa (`etapas`) e vice-versa: duas
 *      telas com donos diferentes escrevendo no mesmo objeto. Foi o risco
 *      identificado antes de o mapa existir, e é o caso "enabled não apaga
 *      etapas".
 *   4. MERGE PROFUNDO DEMAIS — fundir `etapas` por stageId tornaria impossível
 *      desmapear uma coluna. O caso "etapas é substituído inteiro" segura o
 *      quarto nível fechado.
 *
 * Sabotagem provada nos dois sentidos: trocar o spread do módulo por
 * atribuição deixa o caso 3 vermelho; fundir `etapas` deixa o caso 4 vermelho.
 */
import { describe, expect, it } from "vitest";

import {
  ehPapelConfiguravelDaEtapaDoFunil,
  ehPapelDaEtapaDoFunil,
  lerMapaDeEtapasDoCopiloto,
  mergeConfiguracaoDeModulos,
  moduloDeFunilAtivo,
} from "./modulos";

const A = "11111111-1111-4111-8111-000000000001";
const B = "11111111-1111-4111-8111-000000000002";

describe("moduloDeFunilAtivo", () => {
  it("é true somente quando enabled === true", () => {
    expect(moduloDeFunilAtivo({ modulos: { x: { enabled: true } } }, "x")).toBe(true);
    expect(moduloDeFunilAtivo({ modulos: { x: { enabled: false } } }, "x")).toBe(false);
  });

  it("é false para settings ausente ou nulo", () => {
    expect(moduloDeFunilAtivo(null, "x")).toBe(false);
    expect(moduloDeFunilAtivo(undefined, "x")).toBe(false);
    expect(moduloDeFunilAtivo({}, "x")).toBe(false);
  });

  it("é false quando o módulo pedido não existe (mesmo com outros ligados)", () => {
    expect(moduloDeFunilAtivo({ modulos: { outro: { enabled: true } } }, "x")).toBe(false);
  });

  it("é false para enabled em forma errada: string, number, null, objeto", () => {
    for (const enabled of ["true", 1, null, {}, [true]]) {
      expect(moduloDeFunilAtivo({ modulos: { x: { enabled } } }, "x")).toBe(false);
    }
  });

  it("é false quando modulos ou o módulo são array/string/null", () => {
    expect(moduloDeFunilAtivo({ modulos: [] }, "x")).toBe(false);
    expect(moduloDeFunilAtivo({ modulos: "x" }, "x")).toBe(false);
    expect(moduloDeFunilAtivo({ modulos: null }, "x")).toBe(false);
    expect(moduloDeFunilAtivo({ modulos: { x: [] } }, "x")).toBe(false);
    expect(moduloDeFunilAtivo({ modulos: { x: true } }, "x")).toBe(false);
    expect(moduloDeFunilAtivo({ modulos: { x: null } }, "x")).toBe(false);
  });

  it("um módulo com etapas mas sem enabled está desligado", () => {
    expect(moduloDeFunilAtivo({ modulos: { x: { etapas: { [A]: "conversa" } } } }, "x")).toBe(false);
  });

  it("ignora chaves herdadas do protótipo", () => {
    expect(moduloDeFunilAtivo({ modulos: {} }, "toString")).toBe(false);
  });
});

describe("lerMapaDeEtapasDoCopiloto", () => {
  it("lê os configuráveis e descarta ganho/perdido, nome de coluna, chave vazia e tipo errado", () => {
    const r = lerMapaDeEtapasDoCopiloto({
      modulos: {
        copiloto_comercial: {
          etapas: {
            [A]: "conversa",
            [B]: "ganho", // terminal: só is_won produz
            "33333333-3333-4333-8333-000000000003": "perdido",
            "44444444-4444-4444-8444-000000000004": "Contato Feito",
            "": "prospeccao",
            "55555555-5555-4555-8555-000000000005": 1,
          },
        },
      },
    });
    expect(r.etapas).toEqual({ [A]: "conversa" });
    expect(r.descartadas).toBe(5);
  });

  it("devolve vazio para settings ausente, sem módulo, ou etapas em forma errada", () => {
    for (const s of [null, undefined, {}, { modulos: [] }, { modulos: { copiloto_comercial: {} } }, { modulos: { copiloto_comercial: { etapas: [] } } }]) {
      expect(lerMapaDeEtapasDoCopiloto(s as never)).toEqual({ etapas: {}, descartadas: 0 });
    }
  });

  it("ehPapelDaEtapaDoFunil aceita os nove; ehPapelConfiguravelDaEtapaDoFunil só os sete", () => {
    expect(ehPapelDaEtapaDoFunil("ganho")).toBe(true);
    expect(ehPapelConfiguravelDaEtapaDoFunil("ganho")).toBe(false);
    expect(ehPapelConfiguravelDaEtapaDoFunil("perdido")).toBe(false);
    expect(ehPapelConfiguravelDaEtapaDoFunil("conversa")).toBe(true);
    expect(ehPapelConfiguravelDaEtapaDoFunil("Conversa")).toBe(false);
    expect(ehPapelConfiguravelDaEtapaDoFunil(null)).toBe(false);
  });
});

describe("mergeConfiguracaoDeModulos — nível 2 (entre módulos)", () => {
  it("não apaga módulo existente ao atualizar outro", () => {
    const atual = { a: { enabled: true }, b: { enabled: false } };
    const r = mergeConfiguracaoDeModulos(atual, { copiloto_comercial: { enabled: true } });
    expect(r).toEqual({
      a: { enabled: true },
      b: { enabled: false },
      copiloto_comercial: { enabled: true },
    });
  });

  it("aceita atual null/undefined e devolve só o patch", () => {
    expect(mergeConfiguracaoDeModulos(null, { copiloto_comercial: { enabled: true } })).toEqual({
      copiloto_comercial: { enabled: true },
    });
    expect(mergeConfiguracaoDeModulos(undefined, { copiloto_comercial: { enabled: true } })).toEqual({
      copiloto_comercial: { enabled: true },
    });
  });

  it("atual inválido (array, string, número) não explode e vira vazio", () => {
    for (const atual of [[], "lixo", 42, true]) {
      expect(() => mergeConfiguracaoDeModulos(atual, { copiloto_comercial: { enabled: true } })).not.toThrow();
      expect(mergeConfiguracaoDeModulos(atual, { copiloto_comercial: { enabled: true } })).toEqual({
        copiloto_comercial: { enabled: true },
      });
    }
  });

  it("patch vazio devolve o atual intacto", () => {
    const atual = { a: { enabled: true } };
    expect(mergeConfiguracaoDeModulos(atual, {})).toEqual(atual);
  });

  it("módulo explicitamente undefined no patch não altera nem cria", () => {
    const atual = { a: { enabled: true } };
    expect(mergeConfiguracaoDeModulos(atual, { copiloto_comercial: undefined })).toEqual(atual);
  });

  it("não muta os objetos de entrada", () => {
    const atual = { copiloto_comercial: { enabled: true, etapas: { [A]: "conversa" } } };
    const congelado = structuredClone(atual);
    mergeConfiguracaoDeModulos(atual, { copiloto_comercial: { enabled: false } });
    expect(atual).toEqual(congelado);
  });
});

describe("mergeConfiguracaoDeModulos — nível 3 (dentro do módulo)", () => {
  it("salvar enabled NÃO apaga etapas — o risco que motivou este nível", () => {
    const atual = { copiloto_comercial: { enabled: true, etapas: { [A]: "conversa" } } };
    const r = mergeConfiguracaoDeModulos(atual, { copiloto_comercial: { enabled: false } });
    expect(r).toEqual({ copiloto_comercial: { enabled: false, etapas: { [A]: "conversa" } } });
  });

  it("salvar etapas NÃO apaga enabled", () => {
    const atual = { copiloto_comercial: { enabled: true, etapas: { [A]: "conversa" } } };
    const r = mergeConfiguracaoDeModulos(atual, { copiloto_comercial: { etapas: { [B]: "apresentacao" } } });
    expect(r).toEqual({ copiloto_comercial: { enabled: true, etapas: { [B]: "apresentacao" } } });
  });

  it("salvar o copiloto não apaga os outros módulos nem as propriedades deles", () => {
    const atual = {
      outro: { enabled: true, qualquer_coisa: [1, 2] },
      copiloto_comercial: { enabled: true },
    };
    const r = mergeConfiguracaoDeModulos(atual, { copiloto_comercial: { etapas: { [A]: "prospeccao" } } });
    expect(r).toEqual({
      outro: { enabled: true, qualquer_coisa: [1, 2] },
      copiloto_comercial: { enabled: true, etapas: { [A]: "prospeccao" } },
    });
  });

  it("propriedade desconhecida já gravada no módulo sobrevive ao patch", () => {
    // Escrita por SQL ou por versão futura: o merge não sabe dela e não a apaga.
    const atual = { copiloto_comercial: { enabled: true, futuro: "x" } };
    const r = mergeConfiguracaoDeModulos(atual, { copiloto_comercial: { enabled: false } });
    expect(r).toEqual({ copiloto_comercial: { enabled: false, futuro: "x" } });
  });

  it("módulo atual inválido (array/string) vira o patch inteiro, sem lançar", () => {
    for (const modulo of [[], "lixo", 7, null]) {
      const r = mergeConfiguracaoDeModulos({ copiloto_comercial: modulo }, { copiloto_comercial: { enabled: true } });
      expect(r).toEqual({ copiloto_comercial: { enabled: true } });
    }
  });
});

describe("mergeConfiguracaoDeModulos — NÃO há nível 4", () => {
  it("etapas enviado substitui o mapa INTEIRO, não funde por stageId", () => {
    const atual = { copiloto_comercial: { enabled: true, etapas: { [A]: "conversa" } } };
    const r = mergeConfiguracaoDeModulos(atual, { copiloto_comercial: { etapas: { [B]: "apresentacao" } } });
    expect((r.copiloto_comercial as { etapas: unknown }).etapas).toEqual({ [B]: "apresentacao" });
    expect((r.copiloto_comercial as { etapas: Record<string, unknown> }).etapas[A]).toBeUndefined();
  });

  it("etapas vazio desmapeia tudo — é a única forma de tirar uma coluna do mapa", () => {
    const atual = { copiloto_comercial: { enabled: true, etapas: { [A]: "conversa", [B]: "prospeccao" } } };
    const r = mergeConfiguracaoDeModulos(atual, { copiloto_comercial: { etapas: {} } });
    expect(r).toEqual({ copiloto_comercial: { enabled: true, etapas: {} } });
  });
});
