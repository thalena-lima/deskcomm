/**
 * O MOTOR da cadência de follow-up — genérico: opera QUALQUER cadência que
 * receba, e não conhece dia, tema ou horário de campanha nenhuma.
 *
 * Os dados (D0, D1, D3…, os temas, a janela de horários) são CONTEÚDO e moram
 * no playbook — para o `afb_comercial_v1`, em
 * `lib/afb/playbooks/comercial/followups.ts` (`playbook.followup`). Este
 * arquivo já carregou uma campanha inteira (a de 20 dias, quatro follow-ups)
 * e ficou em conflito com o documento no dia em que a campanha mudou. Motor
 * que conhece o dado da campanha envelhece com ela; motor que só sabe operar
 * uma cadência fornecida, não.
 *
 * Os tipos são os do conteúdo (`lib/afb/playbooks/types.ts`) — de propósito,
 * para não existirem duas formas de "toque". Só tipos: não há dependência de
 * execução do motor sobre o conteúdo.
 *
 * Regras de contagem que valem para qualquer cadência:
 *   - dias CIVIS (meia-noite a meia-noite, UTC), não intervalos de 24h;
 *   - o toque do próprio dia conta como "próximo";
 *   - depois do último toque não há próximo: a cadência acabou;
 *   - a ordem dos toques no playbook não importa — o motor ordena por dia.
 */
import type { Cadencia, JanelaDeContato, Toque } from "@/lib/afb/playbooks/types";

const MS_POR_DIA = 86_400_000;

/**
 * Dias corridos desde o início da cadência, em dias CIVIS (meia-noite a
 * meia-noite, UTC), nunca negativo. Uma abordagem às 17h e a consulta às 9h
 * do dia seguinte é D1 — calendário de playbook conta dias, não intervalos.
 * Data inválida devolve 0: melhor "hoje é D0" do que NaN atravessando a tela.
 */
export function diaDaCadencia(inicio: Date, agora: Date): number {
  const i = Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), inicio.getUTCDate());
  const a = Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate());
  if (!Number.isFinite(i) || !Number.isFinite(a)) return 0;
  return Math.max(0, Math.floor((a - i) / MS_POR_DIA));
}

/** Os toques válidos (dia finito), ordenados por dia. Não muta a cadência. */
export function toquesOrdenados(cadencia: Cadencia): readonly Toque[] {
  return cadencia.toques
    .filter((t) => Number.isFinite(t.dia))
    .slice()
    .sort((a, b) => a.dia - b.dia);
}

export function primeiroToque(cadencia: Cadencia): Toque | null {
  return toquesOrdenados(cadencia)[0] ?? null;
}

export function ultimoToque(cadencia: Cadencia): Toque | null {
  return toquesOrdenados(cadencia).at(-1) ?? null;
}

/**
 * O próximo toque a partir de um dia — o toque do PRÓPRIO dia conta como
 * "próximo". Dia negativo cai no primeiro; depois do último, `null`; dia
 * inválido (NaN, Infinity), `null`; cadência sem toques, `null`.
 */
export function proximoToque(cadencia: Cadencia, dia: number): Toque | null {
  if (!Number.isFinite(dia)) return null;
  const ordenados = toquesOrdenados(cadencia);
  if (dia < 0) return ordenados[0] ?? null;
  return ordenados.find((t) => t.dia >= dia) ?? null;
}

/** Os toques cujo dia já passou ou é hoje — o que deveria ter saído até agora. */
export function toquesVencidos(cadencia: Cadencia, dia: number): readonly Toque[] {
  if (!Number.isFinite(dia)) return [];
  return toquesOrdenados(cadencia).filter((t) => t.dia <= dia);
}

/** A data civil (UTC) de um toque, dada a âncora. */
export function dataDoToque(inicio: Date, toque: Toque): Date {
  const base = Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), inicio.getUTCDate());
  return new Date(base + toque.dia * MS_POR_DIA);
}

/** Depois do último toque não há mais nada a fazer. Cadência vazia está sempre encerrada. */
export function cadenciaEncerrada(cadencia: Cadencia, dia: number): boolean {
  const ultimo = ultimoToque(cadencia);
  if (!ultimo) return true;
  if (!Number.isFinite(dia)) return false;
  return dia > ultimo.dia;
}

/**
 * Um toque pode sair agora? Avalia a JANELA que o playbook define:
 * `permitido` dentro das faixas em dia permitido; `desaconselhado` quando o
 * playbook marca a combinação dia/período como ruim sem proibir; senão
 * `fora_da_janela`.
 *
 * Recebe hora/minuto/dia-da-semana já no fuso de quem atende — este arquivo
 * não sabe de fuso, e não deve: a conversão é de quem tem o relógio.
 */
export function janelaDoToque(
  janela: JanelaDeContato,
  diaDaSemana: number,
  hora: number,
  minuto: number,
): "permitido" | "desaconselhado" | "fora_da_janela" {
  if (!janela.diasPermitidos.includes(diaDaSemana)) return "fora_da_janela";
  const minutos = hora * 60 + minuto;
  if (!Number.isFinite(minutos)) return "fora_da_janela";
  const dentro = janela.faixas.some((f) => minutos >= f.inicioMin && minutos < f.fimMin);
  if (!dentro) return "fora_da_janela";
  const periodo = minutos < janela.inicioDaTardeMin ? "manha" : "tarde";
  const ruim = janela.desaconselhados.some((d) => d.diaDaSemana === diaDaSemana && d.periodo === periodo);
  return ruim ? "desaconselhado" : "permitido";
}
