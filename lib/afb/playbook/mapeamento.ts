/**
 * Funil → playbook: a regra pura que liga as duas réguas.
 *
 * ─── Onde mora o mapeamento ──────────────────────────────────────────────────
 *
 * `crm_pipelines.settings.modulos.copiloto_comercial.etapas`, um objeto
 * `{ [id da etapa do funil]: papel }`. Por FUNIL, porque "Comercial AFB" e
 * "Prospecção AFB" têm colunas diferentes e cada um diz quais são as suas; por
 * ID da etapa, porque é a única chave que não muda quando alguém renomeia a
 * coluna (o slug também não muda, mas nasce do nome — o id nasce do banco).
 *
 * As alternativas, e por que não:
 *   - `custom_fields.etapa_playbook` no LEAD: é posição DENTRO da coluna, não o
 *     papel da coluna. Continua existindo com esse papel — ver `posicaoNoPlaybook`.
 *   - coluna nova em `crm_stages`: migration + baseline + MANIFEST para um dado
 *     que só um módulo lê; e `agent_stage_hint` é vocabulário do agente do core.
 *   - posição da coluna: reordenar o quadro trocaria o playbook de lugar em
 *     silêncio.
 *   - nome/slug da coluna: é exatamente o acoplamento que se quer evitar.
 *
 * ─── O que vence a configuração ─────────────────────────────────────────────
 *
 * `crm_stages.is_won` e `is_lost` são estado final do CRM e vêm ANTES de
 * qualquer configuração: uma coluna marcada como «ganho» é `ganho` mesmo que o
 * jsonb diga outra coisa. Configurar `ganho`/`perdido` numa coluna SEM a
 * marcação é aceito — o vocabulário é fechado e é o do core — e vale como
 * escolha explícita de quem configurou.
 *
 * ─── Leitura defensiva ──────────────────────────────────────────────────────
 *
 * O jsonb pode ter sido escrito à mão. Entrada inválida é DESCARTADA, nunca
 * lança: o inbox está renderizando e um throw aqui derruba a tela inteira por
 * uma chave torta. Coluna sem papel válido sai como `nao_mapeada`, que é um
 * estado declarado — o painel mostra "esta coluna não está configurada", não
 * um chute.
 */
import { lerMapaDeEtapasDoCopiloto, type MapaDeEtapasDoCopiloto } from "@/lib/pipelines/modulos";

import type { EtapaId } from "./etapas";
import { ehEtapaId } from "./etapas";
import { papel, type PapelDaEtapa } from "./papeis";

/** O mínimo de uma etapa do funil que a regra precisa — estrutural, para não depender do tipo do board. */
export interface EtapaDoFunilMinima {
  id: string;
  is_won: boolean;
  is_lost: boolean;
}

/**
 * O mapa lido do jsonb — a leitura defensiva é do CORE
 * (`lib/pipelines/modulos.ts`), porque a tela de funis também precisa dela e
 * não pode importar de `lib/afb`. Aqui só o nome que este módulo usa.
 */
export type ConfiguracaoDoCopiloto = MapaDeEtapasDoCopiloto;

export const lerConfiguracaoDoCopiloto = lerMapaDeEtapasDoCopiloto;

export type PapelResolvido =
  | { mapeada: true; papel: PapelDaEtapa; origem: "marcacao" | "configuracao" }
  | { mapeada: false; motivo: "sem_configuracao" };

/**
 * O papel de UMA coluna do funil. Marcação do CRM primeiro, configuração
 * depois, e "não sei" declarado quando nenhuma das duas responde.
 */
export function papelDaEtapaDoFunil(
  etapa: EtapaDoFunilMinima,
  config: ConfiguracaoDoCopiloto,
): PapelResolvido {
  if (etapa.is_won) return { mapeada: true, papel: papel("ganho"), origem: "marcacao" };
  if (etapa.is_lost) return { mapeada: true, papel: papel("perdido"), origem: "marcacao" };
  const id = config.etapas[etapa.id];
  if (id) return { mapeada: true, papel: papel(id), origem: "configuracao" };
  return { mapeada: false, motivo: "sem_configuracao" };
}

export interface ColunaMapeada {
  stageId: string;
  resultado: PapelResolvido;
}

/** O funil inteiro, coluna a coluna — o que a tela de configuração vai listar. */
export function mapearFunil(
  etapas: readonly EtapaDoFunilMinima[],
  config: ConfiguracaoDoCopiloto,
): { colunas: ColunaMapeada[]; naoMapeadas: string[] } {
  const colunas = etapas.map((e) => ({ stageId: e.id, resultado: papelDaEtapaDoFunil(e, config) }));
  const naoMapeadas = colunas.filter((c) => !c.resultado.mapeada).map((c) => c.stageId);
  return { colunas, naoMapeadas };
}

export type PosicaoNoPlaybook =
  | {
      /** A etapa do playbook em que a conversa está. */
      etapa: EtapaId;
      /**
       * `gravada`  — `custom_fields.etapa_playbook` existe e cabe nesta coluna.
       * `inicial`  — não havia valor válido; é a primeira etapa que cabe aqui.
       * `ajustada` — havia valor, mas de outra coluna; foi trazido para a
       *              primeira desta. O painel deve DIZER isso, não esconder.
       */
      origem: "gravada" | "inicial" | "ajustada";
      permitidas: readonly EtapaId[];
    }
  | {
      etapa: null;
      /** A coluna não tem etapa de WhatsApp (apresentação, fechamento, final…). */
      origem: "fora_do_playbook";
      permitidas: readonly EtapaId[];
    };

/**
 * Em que etapa do playbook a conversa está, dado o papel da coluna e o que o
 * lead tem gravado.
 *
 * O papel LIMITA; o campo POSICIONA. `etapa_playbook` é fonte de verdade da
 * posição dentro da coluna (a coluna "Contato Feito" não sabe se a conversa
 * está na qualificação ou no convite — só o lead sabe), mas nunca pode apontar
 * para fora do que a coluna permite: card movido de coluna carrega o campo
 * velho, e sem este ajuste o painel sugeriria a Abertura para quem já tem
 * reunião marcada.
 */
export function posicaoNoPlaybook(
  papelDaColuna: PapelDaEtapa,
  etapaGravada: unknown,
): PosicaoNoPlaybook {
  const permitidas = papelDaColuna.etapas;
  if (permitidas.length === 0) return { etapa: null, origem: "fora_do_playbook", permitidas };

  const primeira = permitidas[0]!;
  if (!ehEtapaId(etapaGravada)) return { etapa: primeira, origem: "inicial", permitidas };
  if (permitidas.includes(etapaGravada)) {
    return { etapa: etapaGravada, origem: "gravada", permitidas };
  }
  return { etapa: primeira, origem: "ajustada", permitidas };
}
