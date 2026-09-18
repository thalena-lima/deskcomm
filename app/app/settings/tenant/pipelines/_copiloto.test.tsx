/**
 * A seção «Mapeamento do Copiloto» — o que ela MOSTRA, o que ela ENVIA e o
 * que ela recusa decidir.
 *
 * As regras de verdade (merge em três níveis, vocabulário fechado, chave UUID)
 * são da action e do schema, com testes próprios. O que não pode falhar deste
 * lado é: (a) carregar o mapa gravado e não outro; (b) mandar SÓ `etapas` — é
 * isso que faz o interruptor sobreviver ao salvar daqui, e vice-versa;
 * (c) "não mapeada" tirar a chave, nunca gravar um valor; (d) não oferecer
 * seletor onde a marcação do CRM manda (ganho/perdido); (e) decidir tudo pelo
 * `id` da coluna — o caso «renomeada» prova que o nome não entra.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { EtapaDoFunil } from "@/hooks/pipelines/useAgentMapping";

vi.mock("@/lib/api/client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));
vi.mock("@/app/actions/settings/updatePipelineConfig", () => ({
  updatePipelineConfig: vi.fn(async () => ({ ok: true })),
}));

import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { updatePipelineConfig } from "@/app/actions/settings/updatePipelineConfig";
import { CopilotoMappingSection, NAO_MAPEADA, ROTULO_DO_PAPEL, comEscolha, papelAutomatico } from "./_copiloto";
import { PAPEIS_CONFIGURAVEIS_DA_ETAPA_DO_FUNIL, PAPEIS_DE_ETAPA_DO_FUNIL, PAPEIS_TERMINAIS_DA_ETAPA_DO_FUNIL } from "@/lib/schemas/settings";

// Polyfills que o Radix Select exige e o jsdom não tem.
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
window.HTMLElement.prototype.setPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const PIPE = "11111111-1111-4111-8111-111111111111";
const ID = {
  semContato: "22222222-2222-4222-8222-000000000001",
  contatoFeito: "22222222-2222-4222-8222-000000000002",
  reuniao: "22222222-2222-4222-8222-000000000003",
  ganho: "22222222-2222-4222-8222-000000000004",
  perdido: "22222222-2222-4222-8222-000000000005",
};

/** O funil como a API o devolve — nomes só para a tela mostrar. */
const ETAPAS: EtapaDoFunil[] = [
  { id: ID.semContato, name: "Sem Contato", is_won: false, is_lost: false },
  { id: ID.contatoFeito, name: "Contato Feito", is_won: false, is_lost: false },
  { id: ID.reuniao, name: "Reunião agendada", is_won: false, is_lost: false },
  { id: ID.ganho, name: "Ganho", is_won: true, is_lost: false },
  { id: ID.perdido, name: "Perdido", is_won: false, is_lost: true },
];

const SETTINGS = {
  fields: [{ key: "empresa", label: "Empresa", type: "text" }],
  modulos: {
    copiloto_comercial: {
      enabled: true,
      etapas: { [ID.semContato]: "prospeccao", [ID.contatoFeito]: "conversa" },
    },
  },
};

function montar(settings: Record<string, unknown> | null = SETTINGS) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <CopilotoMappingSection pipelineId={PIPE} settings={settings} />
    </QueryClientProvider>,
  );
}

/** O que a action recebeu no ÚLTIMO salvar. */
function ultimoPatch() {
  const chamadas = vi.mocked(updatePipelineConfig).mock.calls;
  const ultima = chamadas[chamadas.length - 1];
  return { pipelineId: ultima?.[0], patch: ultima?.[1] };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiClient.get).mockResolvedValue({
    data: { etapas: ETAPAS, mapeamento: {} },
  });
});

describe("regras puras", () => {
  it("papelAutomatico: só a marcação do CRM decide, e decide ganho/perdido", () => {
    expect(papelAutomatico(ETAPAS[0]!)).toBeNull();
    expect(papelAutomatico(ETAPAS[3]!)).toBe("ganho");
    expect(papelAutomatico(ETAPAS[4]!)).toBe("perdido");
  });

  it("comEscolha: «não mapeada» REMOVE a chave; papel substitui; não muta", () => {
    const base = { a: "prospeccao", b: "conversa" } as const;
    expect(comEscolha(base, "a", NAO_MAPEADA)).toEqual({ b: "conversa" });
    expect(comEscolha(base, "a", "apresentacao")).toEqual({ a: "apresentacao", b: "conversa" });
    expect(comEscolha(base, "c", "fechamento")).toEqual({ ...base, c: "fechamento" });
    expect(base).toEqual({ a: "prospeccao", b: "conversa" });
  });

  it("todo papel do vocabulário (inclusive os terminais, para a linha «automático») tem rótulo", () => {
    for (const papel of PAPEIS_DE_ETAPA_DO_FUNIL) expect(ROTULO_DO_PAPEL[papel].length).toBeGreaterThan(2);
    expect(Object.keys(ROTULO_DO_PAPEL).sort()).toEqual([...PAPEIS_DE_ETAPA_DO_FUNIL].sort());
  });
});

describe("carregar", () => {
  it("mostra o mapa gravado, coluna a coluna, e «Não mapeada» onde não há chave", async () => {
    montar();
    expect(await screen.findByTestId(`copiloto-papel-${ID.semContato}`)).toHaveTextContent("Prospecção");
    expect(screen.getByTestId(`copiloto-papel-${ID.contatoFeito}`)).toHaveTextContent("Conversa");
    expect(screen.getByTestId(`copiloto-papel-${ID.reuniao}`)).toHaveTextContent("Não mapeada");
  });

  it("ganho e perdido aparecem como automáticos, sem seletor", async () => {
    montar();
    await screen.findByTestId(`copiloto-papel-${ID.semContato}`);
    expect(screen.getByTestId(`copiloto-papel-automatico-${ID.ganho}`)).toHaveTextContent("Ganho (automático)");
    expect(screen.getByTestId(`copiloto-papel-automatico-${ID.perdido}`)).toHaveTextContent("Perdido (automático)");
    expect(screen.queryByTestId(`copiloto-papel-${ID.ganho}`)).toBeNull();
    expect(screen.queryByTestId(`copiloto-papel-${ID.perdido}`)).toBeNull();
  });

  it("settings sem módulo, ou nulo, começa tudo como «Não mapeada»", async () => {
    montar(null);
    expect(await screen.findByTestId(`copiloto-papel-${ID.semContato}`)).toHaveTextContent("Não mapeada");
  });

  it("jsonb torto não derruba a tela: entrada inválida é ignorada", async () => {
    montar({ modulos: { copiloto_comercial: { etapas: { [ID.semContato]: "Sem Contato", [ID.contatoFeito]: "conversa" } } } });
    expect(await screen.findByTestId(`copiloto-papel-${ID.semContato}`)).toHaveTextContent("Não mapeada");
    expect(screen.getByTestId(`copiloto-papel-${ID.contatoFeito}`)).toHaveTextContent("Conversa");
  });

  it("configuração antiga com ganho/perdido numa coluna normal é ignorada: a coluna aparece «Não mapeada»", async () => {
    montar({ modulos: { copiloto_comercial: { etapas: { [ID.semContato]: "ganho", [ID.reuniao]: "perdido" } } } });
    expect(await screen.findByTestId(`copiloto-papel-${ID.semContato}`)).toHaveTextContent("Não mapeada");
    expect(screen.getByTestId(`copiloto-papel-${ID.reuniao}`)).toHaveTextContent("Não mapeada");
    // E as colunas marcadas seguem automáticas, independentemente do jsonb.
    expect(screen.getByTestId(`copiloto-papel-automatico-${ID.ganho}`)).toHaveTextContent("Ganho (automático)");
  });

  it("decide pelo id: a coluna renomeada mantém o papel", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { etapas: [{ ...ETAPAS[0]!, name: "Lista fria" }, ...ETAPAS.slice(1)], mapeamento: {} },
    });
    montar();
    const linha = await screen.findByTestId(`copiloto-etapa-${ID.semContato}`);
    expect(linha).toHaveTextContent("Lista fria");
    expect(within(linha).getByTestId(`copiloto-papel-${ID.semContato}`)).toHaveTextContent("Prospecção");
  });

  it("o seletor oferece «Não mapeada» e os SETE configuráveis, nesta ordem — nunca Ganho/Perdido", async () => {
    const user = userEvent.setup();
    montar();
    await user.click(await screen.findByTestId(`copiloto-papel-${ID.reuniao}`));
    const opcoes = within(await screen.findByRole("listbox"))
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(opcoes).toEqual(["Não mapeada", ...PAPEIS_CONFIGURAVEIS_DA_ETAPA_DO_FUNIL.map((p) => ROTULO_DO_PAPEL[p])]);
    expect(opcoes).toHaveLength(8);
    for (const terminal of PAPEIS_TERMINAIS_DA_ETAPA_DO_FUNIL) expect(opcoes).not.toContain(ROTULO_DO_PAPEL[terminal]);
  });
});

describe("salvar", () => {
  it("alterar um papel manda SÓ etapas, com o novo valor e os outros preservados", async () => {
    const user = userEvent.setup();
    montar();
    await user.click(await screen.findByTestId(`copiloto-papel-${ID.reuniao}`));
    await user.click(await screen.findByRole("option", { name: "Reunião agendada" }));
    await user.click(screen.getByTestId("copiloto-salvar-mapeamento"));

    await waitFor(() => expect(updatePipelineConfig).toHaveBeenCalledTimes(1));
    expect(ultimoPatch()).toEqual({
      pipelineId: PIPE,
      patch: {
        modulos: {
          copiloto_comercial: {
            etapas: {
              [ID.semContato]: "prospeccao",
              [ID.contatoFeito]: "conversa",
              [ID.reuniao]: "reuniao_agendada",
            },
          },
        },
      },
    });
    // Sem `enabled`: é o que deixa o interruptor intacto no merge. E sem
    // fields/lost_reasons: o topo é preservado pela action, não reenviado.
    const modulo = (ultimoPatch().patch as { modulos: { copiloto_comercial: Record<string, unknown> } }).modulos.copiloto_comercial;
    expect(Object.keys(modulo)).toEqual(["etapas"]);
    expect(toast.success).toHaveBeenCalled();
  });

  it("«Não mapeada» tira a chave do mapa — não grava valor nenhum para ela", async () => {
    const user = userEvent.setup();
    montar();
    await user.click(await screen.findByTestId(`copiloto-papel-${ID.contatoFeito}`));
    await user.click(await screen.findByRole("option", { name: "Não mapeada" }));
    await user.click(screen.getByTestId("copiloto-salvar-mapeamento"));

    await waitFor(() => expect(updatePipelineConfig).toHaveBeenCalledTimes(1));
    const etapas = (ultimoPatch().patch as { modulos: { copiloto_comercial: { etapas: Record<string, string> } } }).modulos.copiloto_comercial.etapas;
    expect(etapas).toEqual({ [ID.semContato]: "prospeccao" });
    expect(ID.contatoFeito in etapas).toBe(false);
    expect(Object.values(etapas)).not.toContain(NAO_MAPEADA);
  });

  it("ganho/perdido nunca entram no mapa enviado — a marcação do CRM é a autoridade", async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByTestId(`copiloto-papel-${ID.semContato}`);
    await user.click(screen.getByTestId("copiloto-salvar-mapeamento"));
    await waitFor(() => expect(updatePipelineConfig).toHaveBeenCalledTimes(1));
    const etapas = (ultimoPatch().patch as { modulos: { copiloto_comercial: { etapas: Record<string, string> } } }).modulos.copiloto_comercial.etapas;
    expect(ID.ganho in etapas).toBe(false);
    expect(ID.perdido in etapas).toBe(false);
  });

  it("erro da action vira aviso, e o mapa fica na tela para tentar de novo", async () => {
    vi.mocked(updatePipelineConfig).mockResolvedValueOnce({ ok: false, error: "forbidden_role" });
    const user = userEvent.setup();
    montar();
    await user.click(await screen.findByTestId(`copiloto-papel-${ID.reuniao}`));
    await user.click(await screen.findByRole("option", { name: "Apresentação" }));
    await user.click(screen.getByTestId("copiloto-salvar-mapeamento"));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByTestId(`copiloto-papel-${ID.reuniao}`)).toHaveTextContent("Apresentação");
  });

  it("não salva enquanto as etapas não carregaram", async () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    montar();
    expect(screen.getByTestId("copiloto-carregando")).toBeInTheDocument();
    expect(screen.getByTestId("copiloto-salvar-mapeamento")).toBeDisabled();
  });
});
