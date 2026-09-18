/**
 * O motor da cadência, testado SEM campanha: a fixtura é sintética e o único
 * lugar onde os dias do afb_comercial_v1 são afirmados é o teste do próprio
 * playbook (`lib/afb/playbooks/comercial/comercial.test.ts`). Se um dia de
 * campanha aparecer aqui como constante do motor, é regressão de arquitetura.
 */
import { describe, expect, it } from "vitest";

import type { Cadencia, JanelaDeContato, Toque } from "@/lib/afb/playbooks/types";

import {
  cadenciaEncerrada,
  dataDoToque,
  diaDaCadencia,
  janelaDoToque,
  primeiroToque,
  proximoToque,
  toquesOrdenados,
  toquesVencidos,
  ultimoToque,
} from "./cadencia";

const utc = (iso: string) => new Date(iso);

function toque(dia: number, id = `t${dia}`): Toque {
  return { id, dia, rotulo: `Toque ${dia}`, canal: "whatsapp_e_email", tema: "x" };
}

const JANELA: JanelaDeContato = {
  faixas: [
    { inicioMin: 8 * 60 + 30, fimMin: 11 * 60 },
    { inicioMin: 14 * 60, fimMin: 17 * 60 },
  ],
  diasPermitidos: [1, 2, 3, 4, 5],
  desaconselhados: [
    { diaDaSemana: 1, periodo: "manha" },
    { diaDaSemana: 5, periodo: "tarde" },
  ],
  inicioDaTardeMin: 12 * 60,
};

function cadencia(dias: number[]): Cadencia {
  return {
    titulo: "cadência de teste",
    objetivo: "fixtura sintética — nenhum dia daqui é de campanha",
    cicloDias: dias.length ? Math.max(...dias) : 0,
    toques: dias.map((d) => toque(d)),
    respostaInterrompe: true,
    aoResponder: "volta",
    reciclagemMeses: 6,
    janela: JANELA,
    regras: [],
    regraDosCases: "",
  };
}

const C = cadencia([0, 1, 3, 5, 8, 12, 15]);

describe("diaDaCadencia", () => {
  it("conta dias civis, não intervalos de 24h", () => {
    expect(diaDaCadencia(utc("2026-09-01T17:00:00Z"), utc("2026-09-02T09:00:00Z"))).toBe(1);
    expect(diaDaCadencia(utc("2026-09-01T00:00:00Z"), utc("2026-09-01T23:59:59Z"))).toBe(0);
    expect(diaDaCadencia(utc("2026-09-01T12:00:00Z"), utc("2026-09-16T12:00:00Z"))).toBe(15);
  });

  it("nunca é negativo, e data inválida vira D0", () => {
    expect(diaDaCadencia(utc("2026-09-05T00:00:00Z"), utc("2026-09-01T00:00:00Z"))).toBe(0);
    expect(diaDaCadencia(new Date("lixo"), utc("2026-09-01T00:00:00Z"))).toBe(0);
  });
});

describe("proximoToque", () => {
  it("dia exato: o toque do próprio dia conta como próximo", () => {
    expect(proximoToque(C, 0)?.dia).toBe(0);
    expect(proximoToque(C, 3)?.dia).toBe(3);
    expect(proximoToque(C, 15)?.dia).toBe(15);
  });

  it("intervalos: entre dois toques devolve o seguinte", () => {
    expect(proximoToque(C, 2)?.dia).toBe(3);
    expect(proximoToque(C, 4)?.dia).toBe(5);
    expect(proximoToque(C, 9)?.dia).toBe(12);
    expect(proximoToque(C, 13)?.dia).toBe(15);
  });

  it("antes do primeiro cai no primeiro; depois do último não há próximo", () => {
    expect(proximoToque(C, -1)?.dia).toBe(0);
    expect(proximoToque(C, 16)).toBeNull();
    expect(proximoToque(C, 999)).toBeNull();
  });

  it("lista vazia e entrada malformada devolvem null sem lançar", () => {
    expect(proximoToque(cadencia([]), 0)).toBeNull();
    expect(proximoToque(C, Number.NaN)).toBeNull();
    expect(proximoToque(C, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("não depende da ordem em que o playbook listou os toques, e ignora toque com dia inválido", () => {
    const bagunca: Cadencia = { ...C, toques: [toque(15), toque(Number.NaN, "torto"), toque(3), toque(0), toque(8)] };
    expect(toquesOrdenados(bagunca).map((t) => t.dia)).toEqual([0, 3, 8, 15]);
    expect(proximoToque(bagunca, 4)?.dia).toBe(8);
    // E não mutou a entrada.
    expect(bagunca.toques.map((t) => t.dia)).toEqual([15, Number.NaN, 3, 0, 8]);
  });
});

describe("primeiro / último / encerrada", () => {
  it("primeiro e último toque", () => {
    expect(primeiroToque(C)?.dia).toBe(0);
    expect(ultimoToque(C)?.dia).toBe(15);
    expect(primeiroToque(cadencia([]))).toBeNull();
    expect(ultimoToque(cadencia([]))).toBeNull();
  });

  it("encerrada só depois do último toque; vazia está sempre encerrada", () => {
    expect(cadenciaEncerrada(C, 15)).toBe(false);
    expect(cadenciaEncerrada(C, 16)).toBe(true);
    expect(cadenciaEncerrada(cadencia([]), 0)).toBe(true);
    expect(cadenciaEncerrada(C, Number.NaN)).toBe(false);
  });

  it("o motor não carrega campanha nenhuma: o que ele sabe é o que recebeu", () => {
    const outra = cadencia([0, 2, 7]);
    expect(ultimoToque(outra)?.dia).toBe(7);
    expect(proximoToque(outra, 3)?.dia).toBe(7);
    expect(cadenciaEncerrada(outra, 8)).toBe(true);
  });
});

describe("toquesVencidos / dataDoToque", () => {
  it("vencidos são os de dia ≤ hoje, em ordem", () => {
    expect(toquesVencidos(C, 8).map((t) => t.dia)).toEqual([0, 1, 3, 5, 8]);
    expect(toquesVencidos(C, -1)).toEqual([]);
    expect(toquesVencidos(C, Number.NaN)).toEqual([]);
  });

  it("a data de cada toque é a âncora mais o dia, em data civil", () => {
    expect(dataDoToque(utc("2026-09-01T17:30:00Z"), toque(3)).toISOString()).toBe("2026-09-04T00:00:00.000Z");
  });
});

describe("janelaDoToque — avalia a janela recebida", () => {
  it("dentro das faixas em dia permitido é permitido", () => {
    expect(janelaDoToque(JANELA, 2, 8, 30)).toBe("permitido");
    expect(janelaDoToque(JANELA, 3, 10, 59)).toBe("permitido");
    expect(janelaDoToque(JANELA, 4, 14, 0)).toBe("permitido");
    expect(janelaDoToque(JANELA, 2, 16, 59)).toBe("permitido");
  });

  it("fora das faixas, ou dia não permitido, é fora da janela", () => {
    expect(janelaDoToque(JANELA, 2, 8, 29)).toBe("fora_da_janela");
    expect(janelaDoToque(JANELA, 2, 11, 0)).toBe("fora_da_janela");
    expect(janelaDoToque(JANELA, 2, 13, 0)).toBe("fora_da_janela");
    expect(janelaDoToque(JANELA, 2, 17, 0)).toBe("fora_da_janela");
    expect(janelaDoToque(JANELA, 0, 10, 0)).toBe("fora_da_janela");
    expect(janelaDoToque(JANELA, 6, 15, 0)).toBe("fora_da_janela");
    expect(janelaDoToque(JANELA, 2, Number.NaN, 0)).toBe("fora_da_janela");
  });

  it("as combinações desaconselhadas vêm da janela, não do motor", () => {
    expect(janelaDoToque(JANELA, 1, 9, 0)).toBe("desaconselhado");
    expect(janelaDoToque(JANELA, 1, 15, 0)).toBe("permitido");
    expect(janelaDoToque(JANELA, 5, 15, 0)).toBe("desaconselhado");
    expect(janelaDoToque(JANELA, 5, 9, 0)).toBe("permitido");
    // Uma janela sem desaconselhados nunca desaconselha.
    const livre: JanelaDeContato = { ...JANELA, desaconselhados: [] };
    expect(janelaDoToque(livre, 1, 9, 0)).toBe("permitido");
    // Uma janela que permite sábado, permite.
    const comSabado: JanelaDeContato = { ...JANELA, diasPermitidos: [1, 2, 3, 4, 5, 6] };
    expect(janelaDoToque(comSabado, 6, 9, 0)).toBe("permitido");
  });
});
