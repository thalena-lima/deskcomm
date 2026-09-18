/**
 * A action de configuração do funil PRESERVA o que o patch não citou.
 *
 * `crm_pipelines.settings` é um jsonb com chaves de donos diferentes:
 * `fields` e `lost_reasons` (esta tela), `canonical_tags` (leitura do
 * nascimento do lead), `identity_resolution` (default do banco, sem leitor
 * ainda) e agora `modulos` (gate por funil). Nenhum caminho de escrita pode
 * apagar a chave do outro — e o único lugar onde isso é decidido é o merge
 * desta action. Os casos abaixo gravam UM patch e conferem o objeto INTEIRO que
 * foi para o banco; conferir só a chave alterada deixaria passar exatamente o
 * apagamento que se quer impedir.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loadAuthUser, resolveActiveOrg } from "@/lib/auth/server";
import { audit } from "@/lib/audit";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({ loadAuthUser: vi.fn(), resolveActiveOrg: vi.fn() }));
vi.mock("@/lib/audit", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  audit: vi.fn(async () => undefined),
}));

const ORG = "22222222-2222-4222-8222-222222222222";
const PIPELINE = "33333333-3333-4333-8333-333333333333";
const STAGE_A = "44444444-4444-4444-8444-000000000001";
const STAGE_B = "44444444-4444-4444-8444-000000000002";

/** O que um funil real da tela de configuração tem gravado hoje. */
const SETTINGS_ATUAIS = {
  fields: [{ key: "empresa", label: "Empresa", type: "text" }],
  lost_reasons: ["Preço"],
  canonical_tags: ["vip"],
  identity_resolution: { fields_in_priority_order: ["cpf", "phone_e164", "email"] },
  modulos: {
    outro_modulo: { enabled: true },
    copiloto_comercial: { enabled: true, playbook_id: "afb_comercial_v1", etapas: { [STAGE_A]: "conversa" } },
  },
};

/** Supabase mockado: lê `settings` fixo e captura o que o UPDATE gravou. */
function comFunil(settings: Record<string, unknown>) {
  const gravado: { settings?: unknown; vocabulary?: unknown } = {};
  const update = vi.fn((patch: { settings: unknown; vocabulary: unknown }) => {
    gravado.settings = patch.settings;
    gravado.vocabulary = patch.vocabulary;
    return { eq: vi.fn(async () => ({ error: null })) };
  });
  vi.mocked(createClient).mockResolvedValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({
            data: { vocabulary: { lead: "Lead" }, settings, organization_id: ORG },
            error: null,
          })),
        })),
      })),
      update,
    })),
  } as never);
  return gravado;
}

describe("updatePipelineConfig — preservação de settings", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue({ get: () => null } as never);
    vi.mocked(loadAuthUser).mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      is_platform_admin: false,
      support: null,
    } as never);
    vi.mocked(resolveActiveOrg).mockResolvedValue({ orgId: ORG, role: "admin" } as never);
  });

  it("salvar um módulo preserva fields, lost_reasons, canonical_tags, identity_resolution e os outros módulos", async () => {
    const gravado = comFunil(structuredClone(SETTINGS_ATUAIS));
    const { updatePipelineConfig } = await import("./updatePipelineConfig");

    const r = await updatePipelineConfig(PIPELINE, {
      modulos: { copiloto_comercial: { enabled: true } },
    });

    expect(r).toEqual({ ok: true });
    expect(gravado.settings).toEqual({
      ...SETTINGS_ATUAIS,
      modulos: {
        outro_modulo: { enabled: true },
        copiloto_comercial: { enabled: true, playbook_id: "afb_comercial_v1", etapas: { [STAGE_A]: "conversa" } },
      },
    });
  });

  it("salvar fields e lost_reasons (o que a tela sempre manda) não apaga modulos", async () => {
    const gravado = comFunil(structuredClone(SETTINGS_ATUAIS));
    const { updatePipelineConfig } = await import("./updatePipelineConfig");

    await updatePipelineConfig(PIPELINE, {
      fields: [{ key: "cargo", label: "Cargo", type: "text" }],
      lost_reasons: [],
    });

    expect(gravado.settings).toEqual({
      ...SETTINGS_ATUAIS,
      fields: [{ key: "cargo", label: "Cargo", type: "text" }],
      lost_reasons: [],
    });
  });

  it("desligar o interruptor NÃO apaga o mapa de etapas nem o outro módulo", async () => {
    const gravado = comFunil(structuredClone(SETTINGS_ATUAIS));
    const { updatePipelineConfig } = await import("./updatePipelineConfig");

    await updatePipelineConfig(PIPELINE, {
      modulos: { copiloto_comercial: { enabled: false } },
    });

    expect((gravado.settings as { modulos: unknown }).modulos).toEqual({
      outro_modulo: { enabled: true },
      copiloto_comercial: { enabled: false, playbook_id: "afb_comercial_v1", etapas: { [STAGE_A]: "conversa" } },
    });
  });

  it("salvar playbook_id preserva enabled, etapas e os outros módulos; salvar etapas preserva playbook_id", async () => {
    const gravado = comFunil(structuredClone(SETTINGS_ATUAIS));
    const { updatePipelineConfig } = await import("./updatePipelineConfig");

    await updatePipelineConfig(PIPELINE, { modulos: { copiloto_comercial: { playbook_id: "afb_comercial_v1" } } });
    expect((gravado.settings as { modulos: unknown }).modulos).toEqual(SETTINGS_ATUAIS.modulos);

    await updatePipelineConfig(PIPELINE, { modulos: { copiloto_comercial: { etapas: { [STAGE_B]: "apresentacao" } } } });
    expect((gravado.settings as { modulos: { copiloto_comercial: unknown } }).modulos.copiloto_comercial).toEqual({
      enabled: true,
      playbook_id: "afb_comercial_v1",
      etapas: { [STAGE_B]: "apresentacao" },
    });
  });

  it("playbook_id: null limpa a escolha; id desconhecido é 422 sem tocar no banco", async () => {
    const { updatePipelineConfig } = await import("./updatePipelineConfig");
    const gravado = comFunil(structuredClone(SETTINGS_ATUAIS));
    await updatePipelineConfig(PIPELINE, { modulos: { copiloto_comercial: { playbook_id: null } } });
    expect((gravado.settings as { modulos: { copiloto_comercial: { playbook_id: unknown } } }).modulos.copiloto_comercial.playbook_id).toBeNull();

    const gravado2 = comFunil(structuredClone(SETTINGS_ATUAIS));
    const r = await updatePipelineConfig(PIPELINE, {
      modulos: { copiloto_comercial: { playbook_id: "afb_comercial_v9" as never } },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("validation_failed");
    expect(gravado2.settings).toBeUndefined();
  });

  it("salvar o mapa de etapas NÃO apaga enabled, e substitui o mapa inteiro", async () => {
    const gravado = comFunil(structuredClone(SETTINGS_ATUAIS));
    const { updatePipelineConfig } = await import("./updatePipelineConfig");

    await updatePipelineConfig(PIPELINE, {
      modulos: { copiloto_comercial: { etapas: { [STAGE_B]: "apresentacao" } } },
    });

    expect((gravado.settings as { modulos: unknown }).modulos).toEqual({
      outro_modulo: { enabled: true },
      copiloto_comercial: { enabled: true, playbook_id: "afb_comercial_v1", etapas: { [STAGE_B]: "apresentacao" } },
    });
    // E as chaves de topo seguem intactas.
    const { modulos: _m, ...topo } = gravado.settings as Record<string, unknown>;
    const { modulos: _a, ...topoAtual } = SETTINGS_ATUAIS;
    expect(topo).toEqual(topoAtual);
  });

  it("rejeita papel inválido, papel terminal e stage id vazio antes de tocar no banco", async () => {
    const { updatePipelineConfig } = await import("./updatePipelineConfig");
    for (const etapas of [{ [STAGE_A]: "papel_inventado" }, { [STAGE_A]: "ganho" }, { [STAGE_A]: "perdido" }, { "": "conversa" }]) {
      const gravado = comFunil(structuredClone(SETTINGS_ATUAIS));
      const r = await updatePipelineConfig(PIPELINE, {
        modulos: { copiloto_comercial: { etapas: etapas as never } },
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe("validation_failed");
      expect(gravado.settings).toBeUndefined();
    }
  });

  it("funil sem `modulos` gravado (default do banco) ganha a chave sem perder as demais", async () => {
    const { modulos: _semModulos, ...semModulos } = SETTINGS_ATUAIS;
    const gravado = comFunil(structuredClone(semModulos));
    const { updatePipelineConfig } = await import("./updatePipelineConfig");

    await updatePipelineConfig(PIPELINE, {
      modulos: { copiloto_comercial: { enabled: true } },
    });

    expect(gravado.settings).toEqual({
      ...semModulos,
      modulos: { copiloto_comercial: { enabled: true } },
    });
  });

  it("o audit registra QUAIS módulos mudaram, nunca o valor", async () => {
    comFunil(structuredClone(SETTINGS_ATUAIS));
    const { updatePipelineConfig } = await import("./updatePipelineConfig");

    await updatePipelineConfig(PIPELINE, {
      modulos: { copiloto_comercial: { enabled: true } },
    });

    const entrada = vi.mocked(audit).mock.calls[0]?.[0] as { metadata?: Record<string, unknown> };
    expect(entrada.metadata?.modulos_changed).toEqual(["copiloto_comercial"]);
    expect(JSON.stringify(entrada.metadata)).not.toContain("enabled");
  });

  it("patch sem modulos deixa modulos_changed nulo e a chave intacta", async () => {
    const gravado = comFunil(structuredClone(SETTINGS_ATUAIS));
    const { updatePipelineConfig } = await import("./updatePipelineConfig");

    await updatePipelineConfig(PIPELINE, { lost_reasons: ["Concorrente"] });

    const entrada = vi.mocked(audit).mock.calls[0]?.[0] as { metadata?: Record<string, unknown> };
    expect(entrada.metadata?.modulos_changed).toBeNull();
    expect((gravado.settings as { modulos: unknown }).modulos).toEqual(SETTINGS_ATUAIS.modulos);
  });

  it("rejeita enabled como string antes de tocar no banco", async () => {
    const gravado = comFunil(structuredClone(SETTINGS_ATUAIS));
    const { updatePipelineConfig } = await import("./updatePipelineConfig");

    const r = await updatePipelineConfig(PIPELINE, {
      modulos: { copiloto_comercial: { enabled: "true" as unknown as boolean } },
    });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("validation_failed");
    expect(gravado.settings).toBeUndefined();
  });
});
