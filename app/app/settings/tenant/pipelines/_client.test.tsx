/**
 * O `PipelineEditor` e o interruptor do copiloto — as duas coisas que só
 * nascem NESTA tela:
 *
 *   1. A seção do mapa existe SÓ com o interruptor ligado (estado local: quem
 *      liga vê na hora o que vai configurar; quem desliga a esconde).
 *   2. O botão principal manda `{ enabled }` e nada mais do módulo. É a
 *      metade da tela do par que o merge de três níveis reconcilia — a outra
 *      metade (`{ etapas }` sozinho) está em `_copiloto.test.tsx`. Se este
 *      botão passasse a mandar `etapas` a partir de um estado próprio, as duas
 *      seções voltariam a se apagar.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/lib/api/client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));
vi.mock("@/app/actions/settings/updatePipelineConfig", () => ({
  updatePipelineConfig: vi.fn(async () => ({ ok: true })),
}));
// As seções vizinhas têm testes próprios e leituras próprias; aqui só o editor.
vi.mock("./_stages", () => ({
  StagesSection: () => null,
  ancoraDasEtapas: (id: string) => `etapas-${id}`,
}));
vi.mock("./_mapping", () => ({
  AgentMappingSection: () => null,
  ancoraDoMapeamento: (id: string) => `mapeamento-${id}`,
}));

import { apiClient } from "@/lib/api/client";
import { updatePipelineConfig } from "@/app/actions/settings/updatePipelineConfig";
import { listarMetadadosDePlaybooks } from "@/lib/afb/playbooks/catalogo";
import { PipelinesClient, type PipelineRow } from "./_client";

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
const STAGE = "22222222-2222-4222-8222-000000000001";

function funil(settings: Record<string, unknown>): PipelineRow {
  return { id: PIPE, name: "Comercial", slug: "comercial", vocabulary: null, settings };
}

function montar(settings: Record<string, unknown>, podeEditarConfig = true) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <PipelinesClient pipelines={[funil(settings)]} podeEditarConfig={podeEditarConfig} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiClient.get).mockResolvedValue({
    data: { etapas: [{ id: STAGE, name: "Sem Contato", is_won: false, is_lost: false }], mapeamento: {} },
  });
});

describe("PipelineEditor — interruptor e seção do mapa", () => {
  it("sem permissão de configuração não há editor, interruptor nem mapa", () => {
    montar({ modulos: { copiloto_comercial: { enabled: true } } }, false);
    expect(screen.queryByTestId("copiloto-comercial-liga")).toBeNull();
    expect(screen.queryByTestId(`copiloto-mapeamento-${PIPE}`)).toBeNull();
  });

  it("com o módulo desligado o interruptor está off e o mapa não aparece", () => {
    montar({ fields: [] });
    expect(screen.getByTestId("copiloto-comercial-liga")).toHaveAttribute("data-state", "unchecked");
    expect(screen.queryByTestId(`copiloto-mapeamento-${PIPE}`)).toBeNull();
  });

  it("com o módulo ligado o interruptor está on e o mapa aparece, carregado do settings", async () => {
    montar({ modulos: { copiloto_comercial: { enabled: true, etapas: { [STAGE]: "prospeccao" } } } });
    expect(screen.getByTestId("copiloto-comercial-liga")).toHaveAttribute("data-state", "checked");
    expect(screen.getByTestId(`copiloto-mapeamento-${PIPE}`)).toBeInTheDocument();
    expect(await screen.findByTestId(`copiloto-papel-${STAGE}`)).toHaveTextContent("Prospecção");
  });

  it("ligar o interruptor mostra o mapa na hora; desligar o esconde", async () => {
    const user = userEvent.setup();
    montar({ fields: [] });
    await user.click(screen.getByTestId("copiloto-comercial-liga"));
    expect(screen.getByTestId(`copiloto-mapeamento-${PIPE}`)).toBeInTheDocument();
    await user.click(screen.getByTestId("copiloto-comercial-liga"));
    expect(screen.queryByTestId(`copiloto-mapeamento-${PIPE}`)).toBeNull();
  });

  it("o botão principal manda SÓ enabled no módulo — nunca etapas", async () => {
    const user = userEvent.setup();
    montar({ modulos: { copiloto_comercial: { enabled: true, etapas: { [STAGE]: "prospeccao" } } } });
    await user.click(screen.getByTestId("copiloto-comercial-liga")); // desliga
    await user.click(screen.getByRole("button", { name: /salvar vocabulário e campos/i }));

    await waitFor(() => expect(updatePipelineConfig).toHaveBeenCalledTimes(1));
    const patch = vi.mocked(updatePipelineConfig).mock.calls[0]![1];
    expect(patch.modulos).toEqual({ copiloto_comercial: { enabled: false } });
    // Preservar `etapas` é trabalho do merge na action, e ele só consegue
    // porque a tela NÃO reenvia o mapa por conta própria.
    expect("etapas" in (patch.modulos!.copiloto_comercial as object)).toBe(false);
    // E o playbook, que não foi tocado, também NÃO viaja — é o merge que o preserva.
    expect("playbook_id" in (patch.modulos!.copiloto_comercial as object)).toBe(false);
  });
});

describe("PipelineEditor — seletor de playbook", () => {
  const COM_PLAYBOOK = {
    modulos: { copiloto_comercial: { enabled: true, playbook_id: "afb_comercial_v1", etapas: { [STAGE]: "prospeccao" } } },
  };

  it("só aparece com o módulo ligado, e some ao desligar", async () => {
    const user = userEvent.setup();
    montar({ fields: [] });
    expect(screen.queryByTestId(`copiloto-playbook-${PIPE}`)).toBeNull();
    await user.click(screen.getByTestId("copiloto-comercial-liga"));
    expect(screen.getByTestId(`copiloto-playbook-${PIPE}`)).toBeInTheDocument();
    await user.click(screen.getByTestId("copiloto-comercial-liga"));
    expect(screen.queryByTestId(`copiloto-playbook-${PIPE}`)).toBeNull();
  });

  it("lista os playbooks do CATÁLOGO pelo nome (não pelo id cru), mais «Selecione um playbook»", async () => {
    const user = userEvent.setup();
    montar({ modulos: { copiloto_comercial: { enabled: true } } });
    await user.click(screen.getByTestId("copiloto-playbook-seletor"));
    const opcoes = within(await screen.findByRole("listbox")).getAllByRole("option").map((o) => o.textContent);
    expect(opcoes[0]).toBe("Selecione um playbook");
    const registrados = listarMetadadosDePlaybooks();
    expect(registrados.length).toBeGreaterThan(0);
    expect(opcoes.slice(1)).toEqual(registrados.map((pb) => `${pb.nome} · ${pb.versaoDoDocumento}`));
    // Nenhuma opção é o id cru.
    for (const pb of registrados) expect(opcoes).not.toContain(pb.id);
  });

  it("mostra a seleção atual gravada no settings", () => {
    montar(COM_PLAYBOOK);
    expect(screen.getByTestId("copiloto-playbook-seletor")).toHaveTextContent("Playbook Comercial — Consultoria em Energia");
  });

  it("sem playbook_id (legado) mostra «Selecione um playbook» — não escolhe nenhum sozinho", () => {
    montar({ modulos: { copiloto_comercial: { enabled: true, etapas: { [STAGE]: "prospeccao" } } } });
    expect(screen.getByTestId("copiloto-playbook-seletor")).toHaveTextContent("Selecione um playbook");
  });

  it("playbook_id que o registry não conhece é tratado como sem seleção, sem quebrar a tela", () => {
    montar({ modulos: { copiloto_comercial: { enabled: true, playbook_id: "afb_prospeccao_v1" } } });
    expect(screen.getByTestId("copiloto-playbook-seletor")).toHaveTextContent("Selecione um playbook");
    expect(screen.getByTestId("copiloto-comercial-liga")).toHaveAttribute("data-state", "checked");
  });

  it("trocar o playbook e salvar manda playbook_id junto com enabled — e nada de etapas", async () => {
    const user = userEvent.setup();
    montar({ modulos: { copiloto_comercial: { enabled: true, etapas: { [STAGE]: "prospeccao" } } } });
    await user.click(screen.getByTestId("copiloto-playbook-seletor"));
    await user.click(await screen.findByTestId("copiloto-playbook-opcao-afb_comercial_v1"));
    expect(screen.getByTestId("copiloto-playbook-seletor")).toHaveTextContent("Playbook Comercial");
    await user.click(screen.getByRole("button", { name: /salvar vocabulário e campos/i }));

    await waitFor(() => expect(updatePipelineConfig).toHaveBeenCalledTimes(1));
    const patch = vi.mocked(updatePipelineConfig).mock.calls[0]![1];
    expect(patch.modulos).toEqual({ copiloto_comercial: { enabled: true, playbook_id: "afb_comercial_v1" } });
  });

  it("voltar para «Selecione um playbook» e salvar manda playbook_id: null (limpa a escolha)", async () => {
    const user = userEvent.setup();
    montar(COM_PLAYBOOK);
    await user.click(screen.getByTestId("copiloto-playbook-seletor"));
    await user.click(await screen.findByRole("option", { name: "Selecione um playbook" }));
    await user.click(screen.getByRole("button", { name: /salvar vocabulário e campos/i }));

    await waitFor(() => expect(updatePipelineConfig).toHaveBeenCalledTimes(1));
    const patch = vi.mocked(updatePipelineConfig).mock.calls[0]![1];
    expect(patch.modulos).toEqual({ copiloto_comercial: { enabled: true, playbook_id: null } });
  });

  it("o mapa de etapas continua intacto ao lado do seletor: won/lost automáticos, comum com seletor", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        etapas: [
          { id: STAGE, name: "Sem Contato", is_won: false, is_lost: false },
          { id: "22222222-2222-4222-8222-000000000009", name: "Ganho", is_won: true, is_lost: false },
        ],
        mapeamento: {},
      },
    });
    montar(COM_PLAYBOOK);
    expect(await screen.findByTestId(`copiloto-papel-${STAGE}`)).toHaveTextContent("Prospecção");
    expect(screen.getByTestId("copiloto-papel-automatico-22222222-2222-4222-8222-000000000009")).toHaveTextContent("Ganho (automático)");
  });

  it("manager (sem podeEditarConfig) não vê seletor de playbook", () => {
    montar(COM_PLAYBOOK, false);
    expect(screen.queryByTestId("copiloto-playbook-seletor")).toBeNull();
    expect(screen.queryByTestId("copiloto-comercial-liga")).toBeNull();
  });
});
