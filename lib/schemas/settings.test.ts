import { describe, it, expect } from "vitest";

import {
  profileSchema,
  tenantSchema,
  notificationPrefsSchema,
  pipelineConfigPatchSchema,
  PAPEIS_CONFIGURAVEIS_DA_ETAPA_DO_FUNIL,
  PAPEIS_DE_ETAPA_DO_FUNIL,
  PAPEIS_TERMINAIS_DA_ETAPA_DO_FUNIL,
} from "./settings";

describe("profileSchema", () => {
  it("accepts pt-BR locale + valid timezone", () => {
    const r = profileSchema.safeParse({
      full_name: "Rafael",
      locale: "pt-BR",
      timezone: "America/Sao_Paulo",
      avatar_url: null,
    });
    expect(r.success).toBe(true);
  });

  it("rejects unknown locale", () => {
    const r = profileSchema.safeParse({
      full_name: "x",
      locale: "fr-FR",
      timezone: "America/Sao_Paulo",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid avatar_url", () => {
    const r = profileSchema.safeParse({
      locale: "pt-BR",
      timezone: "UTC",
      avatar_url: "not a url",
    });
    expect(r.success).toBe(false);
  });

  it("coerces empty avatar_url to null", () => {
    const r = profileSchema.safeParse({
      locale: "pt-BR",
      timezone: "UTC",
      avatar_url: "",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.avatar_url).toBeNull();
  });
});

describe("tenantSchema", () => {
  it("accepts a minimal valid tenant payload", () => {
    const r = tenantSchema.safeParse({
      display_name: "Acme",
      legal_name: "Acme LTDA",
      cnpj: "12345678000190",
      timezone: "America/Sao_Paulo",
      locale: "pt-BR",
      currency: "BRL",
      media_retention_days: 90,
      dpo_email: "dpo@acme.com",
      privacy_policy_url: "https://acme.com/privacy",
      lost_reasons_extra: ["Sem orçamento"],
    });
    expect(r.success).toBe(true);
  });

  it("rejects too-low retention", () => {
    const r = tenantSchema.safeParse({
      display_name: "Acme",
      legal_name: "Acme",
      timezone: "UTC",
      locale: "pt-BR",
      media_retention_days: 5,
      lost_reasons_extra: [],
    });
    expect(r.success).toBe(false);
  });

  it("defaults lost_reasons_extra to empty array", () => {
    const r = tenantSchema.safeParse({
      display_name: "Acme",
      legal_name: "Acme",
      timezone: "UTC",
      locale: "pt-BR",
      currency: "BRL",
      media_retention_days: 90,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.lost_reasons_extra).toEqual([]);
  });

  /**
   * ⚠️ `currency` e OBRIGATORIA de proposito, e o contrario seria pior.
   *
   * Com `.default("BRL")`, qualquer salvamento que omitisse o campo — um
   * chamador novo, um payload montado a mao — PISARIA a moeda de uma
   * organizacao mexicana em silencio, porque a action grava a linha inteira.
   * Sao dois chamadores conhecidos (o formulario e a propria action), os dois
   * mandam o campo, e quem esquecer falha ALTO em vez de trocar a unidade do
   * catalogo sem avisar.
   */
  it("exige a moeda em vez de assumir uma", () => {
    const r = tenantSchema.safeParse({
      display_name: "Acme",
      legal_name: "Acme",
      timezone: "UTC",
      locale: "pt-BR",
      media_retention_days: 90,
    });
    expect(r.success).toBe(false);
  });
});

describe("notificationPrefsSchema", () => {
  it("accepts a list of category/channel/enabled tuples", () => {
    const r = notificationPrefsSchema.safeParse({
      prefs: [{ category: "lead_assigned", channel: "email", enabled: true }],
    });
    expect(r.success).toBe(true);
  });

  it("rejects unknown category", () => {
    const r = notificationPrefsSchema.safeParse({
      prefs: [{ category: "bogus", channel: "email", enabled: true }],
    });
    expect(r.success).toBe(false);
  });
});

describe("pipelineConfigPatchSchema", () => {
  it("accepts partial vocabulary patch", () => {
    const r = pipelineConfigPatchSchema.safeParse({
      vocabulary: { lead: "Cliente", won: "Pago" },
    });
    expect(r.success).toBe(true);
  });

  it("validates field key shape", () => {
    const r = pipelineConfigPatchSchema.safeParse({
      fields: [{ key: "1bad", label: "x", type: "text" }],
    });
    expect(r.success).toBe(false);
  });

  it("accepts well-formed fields", () => {
    const r = pipelineConfigPatchSchema.safeParse({
      fields: [{ key: "size", label: "Tamanho", type: "text" }],
      lost_reasons: ["Concorrente", "Preço"],
    });
    expect(r.success).toBe(true);
  });

  /**
   * MÓDULOS POR FUNIL — o que o gate e o mapeamento do inbox vão ler.
   *
   * A leitura é `=== true` / vocabulário fechado sem validar forma, então a
   * ÚNICA barreira contra `"true"` (string), `enable` (erro de digitação),
   * papel inventado e chave vazia é este schema. Se ele afrouxar, a tela parece
   * salvar e o inbox segue desligado ou lê um papel que não existe — a
   * falha-em-verde que o produto self-host não pode ter.
   */
  describe("modulos", () => {
    const A = "11111111-1111-4111-8111-000000000001";

    it("aceita enabled true e false", () => {
      for (const enabled of [true, false]) {
        const r = pipelineConfigPatchSchema.safeParse({
          modulos: { copiloto_comercial: { enabled } },
        });
        expect(r.success).toBe(true);
        if (r.success) expect(r.data.modulos?.copiloto_comercial?.enabled).toBe(enabled);
      }
    });

    it('rejeita enabled "true" como string', () => {
      const r = pipelineConfigPatchSchema.safeParse({
        modulos: { copiloto_comercial: { enabled: "true" } },
      });
      expect(r.success).toBe(false);
    });

    it("rejeita `enable` no lugar de `enabled` (strict)", () => {
      const r = pipelineConfigPatchSchema.safeParse({
        modulos: { copiloto_comercial: { enable: true } },
      });
      expect(r.success).toBe(false);
    });

    it("rejeita módulo desconhecido (strict no nível de modulos)", () => {
      const r = pipelineConfigPatchSchema.safeParse({
        modulos: { modulo_que_nao_existe: { enabled: true } },
      });
      expect(r.success).toBe(false);
    });

    it("rejeita modulos como array", () => {
      const r = pipelineConfigPatchSchema.safeParse({ modulos: [] });
      expect(r.success).toBe(false);
    });

    it("patch sem modulos continua válido e não inventa a chave", () => {
      const r = pipelineConfigPatchSchema.safeParse({ lost_reasons: ["Preço"] });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.modulos).toBeUndefined();
    });

    it("modulos vazio e módulo vazio são válidos (não alteram nada)", () => {
      expect(pipelineConfigPatchSchema.safeParse({ modulos: {} }).success).toBe(true);
      expect(pipelineConfigPatchSchema.safeParse({ modulos: { copiloto_comercial: {} } }).success).toBe(true);
    });

    describe("etapas", () => {
      it("aceita o mapa stageId → papel, sozinho ou com enabled", () => {
        const so = pipelineConfigPatchSchema.safeParse({
          modulos: { copiloto_comercial: { etapas: { [A]: "conversa" } } },
        });
        expect(so.success).toBe(true);
        if (so.success) {
          expect(so.data.modulos?.copiloto_comercial?.etapas).toEqual({ [A]: "conversa" });
          expect(so.data.modulos?.copiloto_comercial?.enabled).toBeUndefined();
        }
        const ambos = pipelineConfigPatchSchema.safeParse({
          modulos: { copiloto_comercial: { enabled: true, etapas: { [A]: "fechamento" } } },
        });
        expect(ambos.success).toBe(true);
      });

      it("aceita os SETE papéis configuráveis", () => {
        expect(PAPEIS_CONFIGURAVEIS_DA_ETAPA_DO_FUNIL).toHaveLength(7);
        for (const papel of PAPEIS_CONFIGURAVEIS_DA_ETAPA_DO_FUNIL) {
          const r = pipelineConfigPatchSchema.safeParse({
            modulos: { copiloto_comercial: { etapas: { [A]: papel } } },
          });
          expect(r.success, papel).toBe(true);
        }
      });

      it("REJEITA ganho e perdido no mapa: terminais vêm de is_won/is_lost, não de configuração", () => {
        expect(PAPEIS_TERMINAIS_DA_ETAPA_DO_FUNIL).toEqual(["ganho", "perdido"]);
        for (const papel of PAPEIS_TERMINAIS_DA_ETAPA_DO_FUNIL) {
          const r = pipelineConfigPatchSchema.safeParse({
            modulos: { copiloto_comercial: { etapas: { [A]: papel } } },
          });
          expect(r.success, papel).toBe(false);
        }
      });

      it("o vocabulário inteiro é configuráveis + terminais, sem sobreposição", () => {
        expect([...PAPEIS_DE_ETAPA_DO_FUNIL]).toEqual([
          ...PAPEIS_CONFIGURAVEIS_DA_ETAPA_DO_FUNIL,
          ...PAPEIS_TERMINAIS_DA_ETAPA_DO_FUNIL,
        ]);
        expect(new Set(PAPEIS_DE_ETAPA_DO_FUNIL).size).toBe(PAPEIS_DE_ETAPA_DO_FUNIL.length);
      });

      it("rejeita papel desconhecido, nome de coluna e maiúscula", () => {
        for (const papel of ["papel_inventado", "Contato Feito", "Conversa", "", 1, null]) {
          const r = pipelineConfigPatchSchema.safeParse({
            modulos: { copiloto_comercial: { etapas: { [A]: papel } } },
          });
          expect(r.success, String(papel)).toBe(false);
        }
      });

      it("rejeita stage id vazio ou que não é UUID", () => {
        for (const chave of ["", " ", "sem-contato", "123"]) {
          const r = pipelineConfigPatchSchema.safeParse({
            modulos: { copiloto_comercial: { etapas: { [chave]: "conversa" } } },
          });
          expect(r.success, JSON.stringify(chave)).toBe(false);
        }
      });

      it("rejeita etapas como array, string ou null", () => {
        for (const etapas of [[], ["conversa"], "conversa", null]) {
          const r = pipelineConfigPatchSchema.safeParse({
            modulos: { copiloto_comercial: { etapas } },
          });
          expect(r.success).toBe(false);
        }
      });

      it("etapas vazio é válido — desmapeia todas as colunas", () => {
        expect(pipelineConfigPatchSchema.safeParse({ modulos: { copiloto_comercial: { etapas: {} } } }).success).toBe(true);
      });

      it("playbook_id aceita só id REGISTRADO, aceita null (limpar) e ausente (não mexe)", () => {
        const ok = pipelineConfigPatchSchema.safeParse({
          modulos: { copiloto_comercial: { playbook_id: "afb_comercial_v1" } },
        });
        expect(ok.success).toBe(true);
        if (ok.success) expect(ok.data.modulos?.copiloto_comercial?.playbook_id).toBe("afb_comercial_v1");
        expect(pipelineConfigPatchSchema.safeParse({ modulos: { copiloto_comercial: { playbook_id: null } } }).success).toBe(true);
        const semId = pipelineConfigPatchSchema.safeParse({ modulos: { copiloto_comercial: { enabled: true } } });
        expect(semId.success).toBe(true);
        if (semId.success) expect(semId.data.modulos?.copiloto_comercial?.playbook_id).toBeUndefined();
      });

      it("playbook_id desconhecido, vazio, nome de funil ou tipo errado é rejeitado", () => {
        for (const id of ["afb_comercial_v9", "", "Comercial AFB", "comercial-afb", 1, true, {}]) {
          const r = pipelineConfigPatchSchema.safeParse({ modulos: { copiloto_comercial: { playbook_id: id } } });
          expect(r.success, String(id)).toBe(false);
        }
      });

      it("enabled + playbook_id + etapas coexistem no mesmo patch", () => {
        const r = pipelineConfigPatchSchema.safeParse({
          modulos: { copiloto_comercial: { enabled: true, playbook_id: "afb_comercial_v1", etapas: { [A]: "conversa" } } },
        });
        expect(r.success).toBe(true);
      });

      it("rejeita propriedade desconhecida no módulo (strict)", () => {
        const r = pipelineConfigPatchSchema.safeParse({
          modulos: { copiloto_comercial: { enabled: true, etapa: {} } },
        });
        expect(r.success).toBe(false);
      });
    });
  });
});
