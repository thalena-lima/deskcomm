/**
 * O CATÁLOGO de playbooks — identidade e metadados LEVES, e só isso.
 *
 * Quem precisa saber que um playbook EXISTE (o schema que valida
 * `playbook_id`, o seletor da tela de funis, o gate quando só pergunta pelo
 * id) importa daqui e carrega umas poucas linhas. Quem precisa do CONTEÚDO
 * (copies, objeções, cadência) importa do registry, que por sua vez importa o
 * conteúdo. A direção é fixa:
 *
 *   catalogo  ←  schema
 *   catalogo  ←  registry  ←  conteúdo
 *   catalogo  ←  tela de funis
 *
 * e NUNCA `schema → registry → conteúdo`: foi assim que o schema de settings
 * passou a carregar ~40 KB de texto comercial para validar uma string, e com
 * dois ou três playbooks isso vira o bundle de toda tela que toca settings.
 *
 * Este arquivo NÃO importa nada de `./comercial/*` nem de `./registry` — o
 * teste ao lado lê o código-fonte e reprova se isso mudar.
 *
 * Playbook novo: uma entrada aqui (identidade) + o diretório de conteúdo + a
 * linha no registry. O teste de sincronia garante que as três andam juntas.
 */

export interface MetadadosDePlaybook {
  id: string;
  nome: string;
  /** A versão do DOCUMENTO de origem ("Versão 6"), não a do id. */
  versaoDoDocumento: string;
  descricao: string;
}

export const CATALOGO_PLAYBOOKS = [
  {
    id: "afb_comercial_v1",
    nome: "Playbook Comercial — Consultoria em Energia",
    versaoDoDocumento: "Versão 6",
    descricao:
      "Sequência de WhatsApp, e-mail, roteiro de ligação, cadência de 15 dias e objeções da campanha de consultoria em eficiência energética.",
  },
] as const satisfies readonly MetadadosDePlaybook[];

/** Os ids válidos derivam do catálogo — id fora dele não compila nem passa em runtime. */
export type PlaybookId = (typeof CATALOGO_PLAYBOOKS)[number]["id"];

export const PLAYBOOK_IDS: readonly PlaybookId[] = CATALOGO_PLAYBOOKS.map((p) => p.id);

export function ehPlaybookId(valor: unknown): valor is PlaybookId {
  return typeof valor === "string" && (PLAYBOOK_IDS as readonly string[]).includes(valor);
}

export function listarMetadadosDePlaybooks(): readonly MetadadosDePlaybook[] {
  return CATALOGO_PLAYBOOKS;
}

export function metadadosDoPlaybook(id: string | null | undefined): MetadadosDePlaybook | null {
  if (!ehPlaybookId(id)) return null;
  return CATALOGO_PLAYBOOKS.find((p) => p.id === id) ?? null;
}
