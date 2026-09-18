import { describe, expect, it } from "vitest";

import { modulosDeFunilSchema } from "@/lib/schemas/settings";

import { copilotoComercialAtivo, MODULO_COPILOTO_COMERCIAL } from "./gate";

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
    // Se alguém renomear a chave num dos lados, o interruptor da tela salva
    // uma coisa e o inbox lê outra — e os dois ficam verdes sozinhos.
    const r = modulosDeFunilSchema.safeParse({ [MODULO_COPILOTO_COMERCIAL]: { enabled: true } });
    expect(r.success).toBe(true);
  });
});
