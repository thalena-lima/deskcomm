/**
 * O registry de playbooks — o CONTEÚDO completo, pelo id, sem banco.
 *
 * Identidade e metadados leves são do catálogo (`catalogo.ts`); este arquivo
 * é o único que importa o conteúdo (`./comercial/*`). Quem só precisa saber
 * se um id existe, ou listar nomes para um seletor, importa do catálogo e não
 * paga o conteúdo. A direção é `catalogo ← registry ← conteúdo`, nunca o
 * inverso — e o teste do catálogo lê o código-fonte para garantir.
 *
 * Playbook inexistente devolve `null`, nunca lança: quem pergunta está
 * renderizando (ou vai estar), e um id torto gravado num funil não pode
 * derrubar a tela. O chamador decide o que mostrar.
 *
 * Um playbook novo = entrada no catálogo + diretório novo + uma linha aqui.
 */
import type { EtapaId } from "@/lib/afb/playbook/etapas";

import { ehPlaybookId, PLAYBOOK_IDS } from "./catalogo";
import { AFB_COMERCIAL_V1 } from "./comercial";
import type {
  Cadencia,
  EtapaPosSim,
  EtapaWhatsapp,
  Mensagem,
  Placeholder,
  Playbook,
  PlaybookId,
} from "./types";

const REGISTRO: ReadonlyMap<PlaybookId, Playbook> = new Map<PlaybookId, Playbook>([
  [AFB_COMERCIAL_V1.id, AFB_COMERCIAL_V1],
]);

/** Identidade continua acessível daqui para quem já tem o registry na mão — mas mora no catálogo. */
export { ehPlaybookId, PLAYBOOK_IDS };

export function getPlaybook(id: string | null | undefined): Playbook | null {
  if (!ehPlaybookId(id)) return null;
  return REGISTRO.get(id) ?? null;
}

export function listarPlaybooks(): readonly Playbook[] {
  return [...REGISTRO.values()];
}

// ─── A etapa do MOTOR resolvida no CONTEÚDO ─────────────────────────────────

/**
 * O que um playbook tem a dizer sobre uma etapa da régua.
 *
 * A régua (`lib/afb/playbook/etapas.ts`) só sabe id, ordem e tipo. Título,
 * objetivo e o material da etapa vêm daqui — do playbook SELECIONADO, nunca de
 * um fixo. `follow_up` não tem copy única: o material dele é a cadência.
 */
export type EtapaResolvida =
  | { tipo: "sequencia"; id: EtapaId; titulo: string; objetivo: string; etapa: EtapaWhatsapp }
  | { tipo: "pos_sim"; id: EtapaId; titulo: string; objetivo: string; etapa: EtapaPosSim }
  | { tipo: "follow_up"; id: EtapaId; titulo: string; objetivo: string; cadencia: Cadencia };

/** `null` quando o playbook não tem conteúdo para a etapa — declarado, não inventado. */
export function etapaDoPlaybookComercial(playbook: Playbook, id: EtapaId): EtapaResolvida | null {
  if (id === "follow_up") {
    const c = playbook.followup;
    return { tipo: "follow_up", id, titulo: c.titulo, objetivo: c.objetivo, cadencia: c };
  }
  if (id === "pos_sim") {
    const p = playbook.whatsapp.posSim;
    return { tipo: "pos_sim", id, titulo: p.titulo, objetivo: p.objetivo, etapa: p };
  }
  const e = playbook.whatsapp.etapas.find((x) => x.id === id);
  if (!e) return null;
  return { tipo: "sequencia", id, titulo: e.titulo, objetivo: e.objetivo, etapa: e };
}

/** Só título e objetivo — para cabeçalho de tela. `null` se o playbook não cobre a etapa. */
export function metadadosDaEtapa(
  playbook: Playbook,
  id: EtapaId,
): { titulo: string; objetivo: string } | null {
  const r = etapaDoPlaybookComercial(playbook, id);
  return r ? { titulo: r.titulo, objetivo: r.objetivo } : null;
}

// ─── Utilitários puros sobre o conteúdo ─────────────────────────────────────

/** Todo `[token]` presente num texto, sem os colchetes, sem repetição, na ordem. */
export function tokensDoTexto(texto: string): string[] {
  const vistos = new Set<string>();
  for (const m of texto.matchAll(/\[([^\]]+)\]/g)) vistos.add(m[1]!);
  return [...vistos];
}

/** Toda mensagem do playbook, de todos os canais e seções — para varreduras. */
export function todasAsMensagens(playbook: Playbook): Mensagem[] {
  const saida: Mensagem[] = [];
  for (const e of playbook.whatsapp.etapas) {
    saida.push(e.mensagem);
    if (e.ponte) saida.push(e.ponte);
  }
  const p = playbook.whatsapp.posSim;
  saida.push(p.confirmacao, p.lembrete24h, p.aberturaComFatura);
  for (const t of playbook.followup.toques) if (t.mensagem) saida.push(t.mensagem);
  for (const v of playbook.email.variacoes) saida.push(v.corpo);
  const l = playbook.ligacao;
  saida.push(l.recepcao, l.doQueSeTrata, l.aberturaComDecisor, l.fechamentoDeAgenda, l.caixaPostal);
  for (const o of playbook.objecoes) saida.push(o.resposta);
  return saida;
}

/** Os placeholders que uma mensagem usa, resolvidos pelo catálogo do playbook (`null` = desconhecido). */
export function placeholdersDaMensagem(
  playbook: Playbook,
  mensagem: Mensagem,
): Array<{ token: string; placeholder: Placeholder | null }> {
  const porToken = new Map(playbook.placeholders.map((p) => [p.token, p]));
  return tokensDoTexto(mensagem.texto).map((token) => ({
    token,
    placeholder: porToken.get(token) ?? null,
  }));
}
