/**
 * Funil → playbook, sem nome de coluna em lugar nenhum.
 *
 * O funil abaixo é o "Comercial AFB" real (10 colunas), mas os nomes só
 * aparecem em COMENTÁRIO: a regra recebe ids e marcações, e é isso que o
 * teste passa. Se alguém introduzir `if (name === "Sem Contato")`, nenhum
 * caso aqui o alimenta — e o caso «renomear não muda nada» prova o inverso.
 */
import { describe, expect, it } from "vitest";

import {
  lerConfiguracaoDoCopiloto,
  mapearFunil,
  papelDaEtapaDoFunil,
  posicaoNoPlaybook,
  type EtapaDoFunilMinima,
} from "./mapeamento";
import { papel } from "./papeis";

const ID = {
  semContato: "11111111-1111-4111-8111-000000000001",
  contatoFeito: "11111111-1111-4111-8111-000000000002",
  preVenda: "11111111-1111-4111-8111-000000000003",
  reuniaoAgendada: "11111111-1111-4111-8111-000000000004",
  apresentacao1: "11111111-1111-4111-8111-000000000005",
  apresentacao2: "11111111-1111-4111-8111-000000000006",
  fechamento: "11111111-1111-4111-8111-000000000007",
  posVenda: "11111111-1111-4111-8111-000000000008",
  ganho: "11111111-1111-4111-8111-000000000009",
  perdido: "11111111-1111-4111-8111-000000000010",
} as const;

const etapa = (id: string, flags: Partial<EtapaDoFunilMinima> = {}): EtapaDoFunilMinima => ({
  id,
  is_won: false,
  is_lost: false,
  ...flags,
});

/** As 10 colunas do Comercial AFB — só id e marcação; o nome não entra. */
const FUNIL_COMERCIAL: EtapaDoFunilMinima[] = [
  etapa(ID.semContato), // 1. Sem Contato
  etapa(ID.contatoFeito), // 2. Contato Feito
  etapa(ID.preVenda), // 3. Pré-venda – ligação
  etapa(ID.reuniaoAgendada), // 4. Reunião agendada
  etapa(ID.apresentacao1), // 5. Apresentação I
  etapa(ID.apresentacao2), // 6. Apresentação II
  etapa(ID.fechamento), // 7. Fechamento
  etapa(ID.posVenda), // 8. Pós-venda
  etapa(ID.ganho, { is_won: true }), // 9. Ganho
  etapa(ID.perdido, { is_lost: true }), // 10. Perdido
];

/** O que ficaria em `settings.modulos.copiloto_comercial.etapas` para esse funil. */
const SETTINGS_COMERCIAL = {
  fields: [],
  modulos: {
    copiloto_comercial: {
      enabled: true,
      etapas: {
        [ID.semContato]: "prospeccao",
        [ID.contatoFeito]: "conversa",
        [ID.preVenda]: "pre_venda",
        [ID.reuniaoAgendada]: "reuniao_agendada",
        [ID.apresentacao1]: "apresentacao",
        [ID.apresentacao2]: "apresentacao",
        [ID.fechamento]: "fechamento",
        [ID.posVenda]: "pos_venda",
      },
    },
  },
};

describe("lerConfiguracaoDoCopiloto", () => {
  it("lê o mapa de etapas e não descarta nada quando está bem formado", () => {
    const c = lerConfiguracaoDoCopiloto(SETTINGS_COMERCIAL);
    expect(Object.keys(c.etapas)).toHaveLength(8);
    expect(c.etapas[ID.contatoFeito]).toBe("conversa");
    expect(c.descartadas).toBe(0);
  });

  it("devolve vazio para settings ausente, sem módulo, ou com etapas em forma errada", () => {
    for (const s of [null, undefined, {}, { modulos: [] }, { modulos: { copiloto_comercial: { enabled: true } } }, { modulos: { copiloto_comercial: { etapas: [] } } }, { modulos: { copiloto_comercial: { etapas: "x" } } }]) {
      expect(lerConfiguracaoDoCopiloto(s as never)).toEqual({ etapas: {}, descartadas: 0 });
    }
  });

  it("descarta entrada inválida (papel desconhecido, nome de coluna, TERMINAL, chave vazia, número) e conta", () => {
    const c = lerConfiguracaoDoCopiloto({
      modulos: {
        copiloto_comercial: {
          etapas: {
            [ID.semContato]: "prospeccao",
            [ID.contatoFeito]: "Contato Feito", // nome, não papel
            [ID.preVenda]: "papel_inventado",
            [ID.ganho]: "ganho", // terminal: só is_won produz — descartado
            [ID.posVenda]: "perdido", // idem
            "": "conversa",
            [ID.fechamento]: 7,
          },
        },
      },
    });
    expect(c.etapas).toEqual({ [ID.semContato]: "prospeccao" });
    expect(c.descartadas).toBe(6);
  });

  it("não olha enabled: o gate é de outro arquivo", () => {
    const c = lerConfiguracaoDoCopiloto({
      modulos: { copiloto_comercial: { enabled: false, etapas: { [ID.semContato]: "prospeccao" } } },
    });
    expect(c.etapas[ID.semContato]).toBe("prospeccao");
  });
});

describe("papelDaEtapaDoFunil", () => {
  const config = lerConfiguracaoDoCopiloto(SETTINGS_COMERCIAL);

  it("resolve pela configuração, por id", () => {
    const r = papelDaEtapaDoFunil(etapa(ID.contatoFeito), config);
    expect(r).toEqual({ mapeada: true, papel: papel("conversa"), origem: "configuracao" });
  });

  it("marcação do CRM vence: is_won é ganho e is_lost é perdido, com ou sem configuração", () => {
    expect(papelDaEtapaDoFunil(etapa(ID.ganho, { is_won: true }), config)).toEqual({
      mapeada: true,
      papel: papel("ganho"),
      origem: "marcacao",
    });
    expect(papelDaEtapaDoFunil(etapa(ID.perdido, { is_lost: true }), config)).toEqual({
      mapeada: true,
      papel: papel("perdido"),
      origem: "marcacao",
    });
    // Configuração dizendo outra coisa para uma coluna MARCADA como ganho é ignorada.
    const torta = lerConfiguracaoDoCopiloto({
      modulos: { copiloto_comercial: { etapas: { [ID.ganho]: "conversa" } } },
    });
    expect(papelDaEtapaDoFunil(etapa(ID.ganho, { is_won: true }), torta)).toEqual({
      mapeada: true,
      papel: papel("ganho"),
      origem: "marcacao",
    });
  });

  it("configuração manual NÃO transforma coluna aberta em terminal: ganho/perdido no jsonb são ignorados", () => {
    const manual = lerConfiguracaoDoCopiloto({
      modulos: { copiloto_comercial: { etapas: { [ID.posVenda]: "ganho", [ID.fechamento]: "perdido" } } },
    });
    // Sem a marcação do CRM, a coluna fica «não mapeada» — nunca «ganho».
    expect(papelDaEtapaDoFunil(etapa(ID.posVenda), manual)).toEqual({ mapeada: false, motivo: "sem_configuracao" });
    expect(papelDaEtapaDoFunil(etapa(ID.fechamento), manual)).toEqual({ mapeada: false, motivo: "sem_configuracao" });
    // E com a marcação, é a marcação que fala — não o jsonb.
    expect(papelDaEtapaDoFunil(etapa(ID.posVenda, { is_won: true }), manual)).toMatchObject({ papel: papel("ganho"), origem: "marcacao" });
    expect(papelDaEtapaDoFunil(etapa(ID.fechamento, { is_lost: true }), manual)).toMatchObject({ papel: papel("perdido"), origem: "marcacao" });
  });

  it("coluna sem configuração é «não mapeada», declarado — nunca um chute", () => {
    const r = papelDaEtapaDoFunil(etapa("22222222-2222-4222-8222-000000000099"), config);
    expect(r).toEqual({ mapeada: false, motivo: "sem_configuracao" });
  });

  it("renomear ou reordenar a coluna não muda nada: a regra só vê id e marcação", () => {
    // O mesmo id com "nome" diferente e em outra posição é a mesma coluna.
    const reordenado = [...FUNIL_COMERCIAL].reverse();
    const { colunas } = mapearFunil(reordenado, config);
    const contato = colunas.find((c) => c.stageId === ID.contatoFeito)!;
    expect(contato.resultado).toMatchObject({ mapeada: true, papel: papel("conversa") });
  });
});

describe("mapearFunil", () => {
  it("mapeia as 10 colunas do Comercial AFB sem sobrar nenhuma", () => {
    const { colunas, naoMapeadas } = mapearFunil(FUNIL_COMERCIAL, lerConfiguracaoDoCopiloto(SETTINGS_COMERCIAL));
    expect(colunas).toHaveLength(10);
    expect(naoMapeadas).toEqual([]);
    const papeis = colunas.map((c) => (c.resultado.mapeada ? c.resultado.papel.id : null));
    expect(papeis).toEqual([
      "prospeccao",
      "conversa",
      "pre_venda",
      "reuniao_agendada",
      "apresentacao",
      "apresentacao",
      "fechamento",
      "pos_venda",
      "ganho",
      "perdido",
    ]);
  });

  it("lista o que ficou sem papel para a tela de configuração cobrar", () => {
    const parcial = lerConfiguracaoDoCopiloto({
      modulos: { copiloto_comercial: { etapas: { [ID.semContato]: "prospeccao" } } },
    });
    const { naoMapeadas } = mapearFunil(FUNIL_COMERCIAL, parcial);
    // Ganho e perdido vêm da marcação, então não entram na lista.
    expect(naoMapeadas).toEqual([
      ID.contatoFeito,
      ID.preVenda,
      ID.reuniaoAgendada,
      ID.apresentacao1,
      ID.apresentacao2,
      ID.fechamento,
      ID.posVenda,
    ]);
  });

  it("um segundo funil (Prospecção AFB) tem o seu próprio mapa, com outras colunas", () => {
    const P = {
      lista: "33333333-3333-4333-8333-000000000001",
      abordado: "33333333-3333-4333-8333-000000000002",
      qualificado: "33333333-3333-4333-8333-000000000003",
      descartado: "33333333-3333-4333-8333-000000000004",
    };
    const settingsProspeccao = {
      modulos: {
        copiloto_comercial: {
          enabled: true,
          etapas: { [P.lista]: "prospeccao", [P.abordado]: "prospeccao", [P.qualificado]: "conversa" },
        },
      },
    };
    const funil = [etapa(P.lista), etapa(P.abordado), etapa(P.qualificado), etapa(P.descartado, { is_lost: true })];
    const { colunas, naoMapeadas } = mapearFunil(funil, lerConfiguracaoDoCopiloto(settingsProspeccao));
    expect(naoMapeadas).toEqual([]);
    expect(colunas.map((c) => (c.resultado.mapeada ? c.resultado.papel.id : null))).toEqual([
      "prospeccao",
      "prospeccao",
      "conversa",
      "perdido",
    ]);
    // E o mapa do Comercial não enxerga as colunas da Prospecção.
    const cruzado = mapearFunil(funil, lerConfiguracaoDoCopiloto(SETTINGS_COMERCIAL));
    expect(cruzado.naoMapeadas).toEqual([P.lista, P.abordado, P.qualificado]);
  });
});

describe("posicaoNoPlaybook", () => {
  it("campo gravado que cabe na coluna é a posição (fonte de verdade)", () => {
    expect(posicaoNoPlaybook(papel("conversa"), "desarme_de_risco")).toEqual({
      etapa: "desarme_de_risco",
      origem: "gravada",
      permitidas: papel("conversa").etapas,
    });
  });

  it("sem campo (ou lixo) começa na primeira etapa que cabe na coluna", () => {
    for (const v of [undefined, null, "", "Abertura", 3]) {
      expect(posicaoNoPlaybook(papel("conversa"), v)).toMatchObject({ etapa: "qualificacao", origem: "inicial" });
    }
    expect(posicaoNoPlaybook(papel("prospeccao"), undefined)).toMatchObject({ etapa: "abertura", origem: "inicial" });
  });

  it("campo de outra coluna é AJUSTADO para a primeira desta — e diz que ajustou", () => {
    // Card foi movido de Contato Feito para Reunião agendada carregando o campo velho.
    expect(posicaoNoPlaybook(papel("reuniao_agendada"), "micro_spin")).toEqual({
      etapa: "pos_sim",
      origem: "ajustada",
      permitidas: ["pos_sim"],
    });
    // E de volta: reunião desmarcada, card volta para Contato Feito.
    expect(posicaoNoPlaybook(papel("conversa"), "pos_sim")).toMatchObject({ etapa: "qualificacao", origem: "ajustada" });
  });

  it("coluna sem etapa de WhatsApp fica fora do playbook, mesmo com campo gravado", () => {
    for (const id of ["apresentacao", "fechamento", "pos_venda", "ganho", "perdido"] as const) {
      expect(posicaoNoPlaybook(papel(id), "convite")).toEqual({
        etapa: null,
        origem: "fora_do_playbook",
        permitidas: [],
      });
    }
  });
});
