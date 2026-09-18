/**
 * O gate do Copiloto Comercial AFB — a ÚNICA peça que nomeia o módulo e que
 * resolve o playbook escolhido pelo funil.
 *
 * O core (`lib/pipelines/modulos.ts`, schema, tela de funis) sabe ler e ligar
 * um "copiloto comercial" por funil e gravar um id de playbook. Que esse
 * copiloto é o playbook da AFB — etapas, copies, objeções — é conhecimento
 * desta camada, `lib/afb/`. A separação é o que permite atualizar o fork a
 * partir do upstream sem que o core carregue nome de cliente.
 *
 * O gate depende da CONFIGURAÇÃO do funil, nunca do nome ou do slug: a mesma
 * organização pode ligar o copiloto em "Comercial" e "Prospecção", cada um
 * com o seu playbook, e deixar os demais funis como estão.
 *
 * ─── O estado é EXPLÍCITO, nunca inventado ──────────────────────────────────
 *
 * Um funil com `enabled: true` e sem `playbook_id` (configuração legada, de
 * antes de existir escolha) NÃO ganha o `afb_comercial_v1` por baixo dos
 * panos: fica em `sem_playbook`, e é a tela que pede a seleção. Id gravado
 * que o registry não conhece mais (playbook removido, jsonb mexido à mão)
 * fica em `playbook_desconhecido` — também sem inventar. O painel só nasce em
 * `pronto`.
 */
import { moduloDeFunilAtivo, playbookIdDoCopiloto } from "@/lib/pipelines/modulos";

// O gate resolve id → Playbook COMPLETO, então é o registry mesmo (conteúdo).
// Quem só precisa de identidade importa `./playbooks/catalogo`.
import { getPlaybook } from "./playbooks/registry";
import type { Playbook } from "./playbooks/types";

/** A chave em `crm_pipelines.settings.modulos` — a mesma do `modulosDeFunilSchema`. */
export const MODULO_COPILOTO_COMERCIAL = "copiloto_comercial" as const;

type Settings = Record<string, unknown> | null | undefined;

/** `true` só com `settings.modulos.copiloto_comercial.enabled === true`. */
export function copilotoComercialAtivo(settings: Settings): boolean {
  return moduloDeFunilAtivo(settings, MODULO_COPILOTO_COMERCIAL);
}

/** O playbook que o funil escolheu, resolvido no registry. `null` = não configurado ou desconhecido. */
export function playbookDoPipeline(settings: Settings): Playbook | null {
  return getPlaybook(playbookIdDoCopiloto(settings));
}

/** Há um id gravado E ele existe no registry. Não olha `enabled`. */
export function copilotoTemPlaybookValido(settings: Settings): boolean {
  return playbookDoPipeline(settings) !== null;
}

export type EstadoDoCopiloto =
  | { estado: "desligado" }
  | { estado: "sem_playbook" }
  | { estado: "playbook_desconhecido"; playbookId: string }
  | { estado: "pronto"; playbook: Playbook };

/**
 * Tudo que o inbox precisa perguntar sobre o copiloto deste funil, de uma vez
 * e sem chute: desligado → nada; ligado sem escolha → pedir a escolha; ligado
 * com id que ninguém conhece → dizer isso; ligado e resolvido → o playbook.
 */
export function estadoDoCopiloto(settings: Settings): EstadoDoCopiloto {
  if (!copilotoComercialAtivo(settings)) return { estado: "desligado" };
  const id = playbookIdDoCopiloto(settings);
  if (id === null) return { estado: "sem_playbook" };
  const playbook = getPlaybook(id);
  if (!playbook) return { estado: "playbook_desconhecido", playbookId: id };
  return { estado: "pronto", playbook };
}
