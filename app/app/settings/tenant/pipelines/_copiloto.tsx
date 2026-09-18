"use client";
/**
 * Mapeamento do Copiloto — que PAPEL cada coluna deste funil desempenha para o
 * copiloto comercial (`settings.modulos.copiloto_comercial.etapas`).
 *
 * ─── O que esta tela decide, e o que ela NÃO decide ─────────────────────────
 *
 * Decide: para cada coluna, um papel do vocabulário fechado, ou "não mapeada"
 * (a chave SAI do mapa — não é um valor). Chave é `stage.id`, nunca nome, slug
 * ou posição: renomear ou reordenar a coluna não muda o papel dela.
 *
 * Não decide: Ganho e Perdido. `crm_stages.is_won` / `is_lost` são a
 * autoridade, e a linha mostra o papel como «automático», sem seletor —
 * oferecer um seletor ali seria oferecer uma escolha que a leitura ignora.
 *
 * ─── Por que um botão de salvar PRÓPRIO ────────────────────────────────────
 *
 * O interruptor do módulo mora no `PipelineEditor` e manda `{ enabled }`;
 * esta seção manda `{ etapas }` e só. É exatamente o par que o merge de três
 * níveis (`mergeConfiguracaoDeModulos`) existe para reconciliar: nenhum dos
 * dois apaga o outro, e nenhum precisa saber do outro para salvar.
 *
 * ─── Fonte das etapas ───────────────────────────────────────────────────────
 *
 * `useAgentMapping`: a MESMA leitura que a seção de etapas e a de mapeamento
 * do agente já fazem, com a mesma chave de cache — uma requisição só, e
 * três seções que não podem discordar sobre quais colunas existem.
 */
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { useT } from "@/hooks/i18n/useT";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePipelineConfig } from "@/app/actions/settings/updatePipelineConfig";
import { useAgentMapping, type EtapaDoFunil } from "@/hooks/pipelines/useAgentMapping";
import { lerMapaDeEtapasDoCopiloto } from "@/lib/pipelines/modulos";
import {
  PAPEIS_CONFIGURAVEIS_DA_ETAPA_DO_FUNIL,
  type PapelConfiguravelDaEtapaDoFunil,
  type PapelDaEtapaDoFunil,
} from "@/lib/schemas/settings";

/**
 * Rótulos do vocabulário INTEIRO — os sete que o seletor oferece e os dois
 * terminais que a linha «automático» mostra. O vocabulário em si é do core
 * (fonte única); aqui só o texto que o administrador lê. `Record` sobre o
 * tipo: papel novo sem rótulo não compila.
 */
export const ROTULO_DO_PAPEL: Readonly<Record<PapelDaEtapaDoFunil, string>> = {
  prospeccao: "Prospecção",
  conversa: "Conversa",
  pre_venda: "Pré-venda",
  reuniao_agendada: "Reunião agendada",
  apresentacao: "Apresentação",
  fechamento: "Fechamento",
  pos_venda: "Pós-venda",
  ganho: "Ganho",
  perdido: "Perdido",
};

/**
 * O valor do seletor para "sem papel". O Radix Select não aceita `""` como
 * valor de item, e "não mapeada" NÃO é um papel: ao salvar, a chave sai do
 * mapa em vez de ganhar este valor.
 */
export const NAO_MAPEADA = "__nao_mapeada__";

/** O mapa que a tela edita — só papéis CONFIGURÁVEIS; ganho/perdido não cabem aqui por tipo. */
export type Mapa = Record<string, PapelConfiguravelDaEtapaDoFunil>;

/** O papel que a marcação do CRM impõe — `null` quando a coluna é comum e o admin escolhe. */
export function papelAutomatico(etapa: EtapaDoFunil): PapelDaEtapaDoFunil | null {
  if (etapa.is_won) return "ganho";
  if (etapa.is_lost) return "perdido";
  return null;
}

/** Aplica a escolha de UMA coluna ao mapa — "não mapeada" REMOVE a chave. Puro, não muta. */
export function comEscolha(mapa: Mapa, stageId: string, valor: string): Mapa {
  const { [stageId]: _anterior, ...resto } = mapa;
  if (valor === NAO_MAPEADA) return resto;
  return { ...resto, [stageId]: valor as PapelConfiguravelDaEtapaDoFunil };
}

export const ancoraDoCopiloto = (pipelineId: string) => `copiloto-${pipelineId}`;

export function CopilotoMappingSection({
  pipelineId,
  settings,
}: {
  pipelineId: string;
  /** O `settings` do funil como veio do servidor — o mapa inicial sai daqui. */
  settings: Record<string, unknown> | null;
}) {
  const t = useT();
  const consulta = useAgentMapping(pipelineId);
  const [mapa, setMapa] = useState<Mapa>(() => ({ ...lerMapaDeEtapasDoCopiloto(settings).etapas }));
  const [isPending, startTransition] = useTransition();

  function salvar() {
    startTransition(async () => {
      // SÓ `etapas`. `enabled` é do interruptor, e o merge preserva o que não
      // veio — mandar `enabled` daqui faria esta seção decidir algo que não é dela.
      const r = await updatePipelineConfig(pipelineId, {
        modulos: { copiloto_comercial: { etapas: mapa } },
      });
      if (r.ok) toast.success(t("Mapeamento do copiloto salvo."));
      else toast.error(`${t("Erro:")} ${r.error}`);
    });
  }

  return (
    <div
      className="space-y-3"
      id={ancoraDoCopiloto(pipelineId)}
      data-testid={`copiloto-mapeamento-${pipelineId}`}
    >
      <div>
        <h3 className="text-sm font-semibold">{t("Mapeamento do Copiloto")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("O que cada coluna deste funil significa para o copiloto comercial. Ganho e Perdido seguem a marcação da própria etapa.")}
        </p>
      </div>

      {consulta.isError ? (
        <p className="text-sm text-text-muted" data-testid="copiloto-erro-leitura">
          {t("Não foi possível carregar as etapas deste funil agora. Recarregue a página.")}
        </p>
      ) : !consulta.data ? (
        <p className="text-sm text-text-muted" data-testid="copiloto-carregando">
          {t("Carregando as etapas deste funil…")}
        </p>
      ) : (
        <ul className="space-y-2">
          {consulta.data.etapas.map((etapa) => {
            const automatico = papelAutomatico(etapa);
            return (
              <li
                key={etapa.id}
                data-testid={`copiloto-etapa-${etapa.id}`}
                className="grid items-center gap-2 rounded-md border border-border p-2 sm:grid-cols-[1fr_auto_16rem]"
              >
                <span className="truncate text-sm font-medium">{etapa.name}</span>
                <span className="hidden text-xs text-text-muted sm:inline" aria-hidden>
                  →
                </span>
                {automatico ? (
                  <span
                    className="text-sm text-text-muted"
                    data-testid={`copiloto-papel-automatico-${etapa.id}`}
                  >
                    {t(ROTULO_DO_PAPEL[automatico])} ({t("automático")})
                  </span>
                ) : (
                  <Select
                    value={mapa[etapa.id] ?? NAO_MAPEADA}
                    onValueChange={(v) => setMapa((atual) => comEscolha(atual, etapa.id, v))}
                    disabled={isPending}
                  >
                    <SelectTrigger
                      aria-label={`${t("Papel de")} «${etapa.name}» ${t("no copiloto")}`}
                      data-testid={`copiloto-papel-${etapa.id}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NAO_MAPEADA}>{t("Não mapeada")}</SelectItem>
                      {/* SÓ os configuráveis: ganho/perdido não são escolha, são marcação. */}
                      {PAPEIS_CONFIGURAVEIS_DA_ETAPA_DO_FUNIL.map((papel) => (
                        <SelectItem key={papel} value={papel}>
                          {t(ROTULO_DO_PAPEL[papel])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex sm:justify-end">
        <Button
          onClick={salvar}
          disabled={isPending || !consulta.data}
          className="w-full sm:w-auto"
          data-testid="copiloto-salvar-mapeamento"
        >
          {isPending ? t("Salvando…") : t("Salvar mapeamento")}
        </Button>
      </div>
    </div>
  );
}
