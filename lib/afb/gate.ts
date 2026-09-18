/**
 * O gate do Copiloto Comercial AFB — a ÚNICA peça que nomeia o módulo.
 *
 * O core (`lib/pipelines/modulos.ts`, schema, tela de funis) sabe ler e ligar
 * um "copiloto comercial" por funil, e só. Que esse copiloto é o playbook da
 * AFB — etapas, variações, objeções — é conhecimento desta camada, `lib/afb/`.
 * A separação é o que permite atualizar o fork a partir do upstream sem que o
 * core carregue nome de cliente.
 *
 * O gate depende da CONFIGURAÇÃO do funil, nunca do nome ou do slug: a mesma
 * organização pode ligar o copiloto em "Comercial" e "Prospecção" e deixar os
 * demais funis como estão.
 */
import { moduloDeFunilAtivo } from "@/lib/pipelines/modulos";

/** A chave em `crm_pipelines.settings.modulos` — a mesma do `modulosDeFunilSchema`. */
export const MODULO_COPILOTO_COMERCIAL = "copiloto_comercial" as const;

/** `true` só com `settings.modulos.copiloto_comercial.enabled === true`. */
export function copilotoComercialAtivo(
  settings: Record<string, unknown> | null | undefined,
): boolean {
  return moduloDeFunilAtivo(settings, MODULO_COPILOTO_COMERCIAL);
}
