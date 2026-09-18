import { describe, expect, it } from "vitest";

import {
  CADENCIA_DE_FOLLOW_UP,
  TOQUES_IDS,
  ULTIMO_DIA_DA_CADENCIA,
  cadenciaEncerrada,
  dataDoToque,
  diaDaCadencia,
  janelaDoToque,
  proximoToque,
  toquesVencidos,
} from "./cadencia";

const utc = (iso: string) => new Date(iso);

describe("CADENCIA_DE_FOLLOW_UP", () => {
  it("é o calendário de 20 dias do playbook: D0, D1, D3, D6, D9, D12, D16, D20", () => {
    expect(CADENCIA_DE_FOLLOW_UP.map((t) => t.id)).toEqual([...TOQUES_IDS]);
    expect(CADENCIA_DE_FOLLOW_UP.map((t) => t.dia)).toEqual([0, 1, 3, 6, 9, 12, 16, 20]);
    expect(CADENCIA_DE_FOLLOW_UP.at(-1)!.dia).toBe(ULTIMO_DIA_DA_CADENCIA);
  });

  it("as duas ligações alternam manhã e tarde e não têm mensagem de WhatsApp", () => {
    const [l1, l2] = CADENCIA_DE_FOLLOW_UP.filter((t) => t.canal === "telefone");
    expect(l1).toMatchObject({ id: "ligacao_1", periodo: "manha", temMensagemDeWhatsapp: false });
    expect(l2).toMatchObject({ id: "ligacao_2", periodo: "tarde", temMensagemDeWhatsapp: false });
  });

  it("o D16 é só e-mail; o D20 é só WhatsApp", () => {
    expect(CADENCIA_DE_FOLLOW_UP.find((t) => t.dia === 16)).toMatchObject({ canal: "email", temMensagemDeWhatsapp: false });
    expect(CADENCIA_DE_FOLLOW_UP.find((t) => t.dia === 20)).toMatchObject({ canal: "whatsapp", temMensagemDeWhatsapp: true });
  });
});

describe("diaDaCadencia", () => {
  it("conta dias civis, não intervalos de 24h", () => {
    // Abordagem às 17h; consulta às 9h do dia seguinte = D1, e não D0.
    expect(diaDaCadencia(utc("2026-09-01T17:00:00Z"), utc("2026-09-02T09:00:00Z"))).toBe(1);
    expect(diaDaCadencia(utc("2026-09-01T00:00:00Z"), utc("2026-09-01T23:59:59Z"))).toBe(0);
    expect(diaDaCadencia(utc("2026-09-01T12:00:00Z"), utc("2026-09-21T12:00:00Z"))).toBe(20);
  });

  it("nunca é negativo (relógio adiantado, âncora no futuro)", () => {
    expect(diaDaCadencia(utc("2026-09-05T00:00:00Z"), utc("2026-09-01T00:00:00Z"))).toBe(0);
  });
});

describe("proximoToque", () => {
  it("o toque do próprio dia conta como próximo", () => {
    expect(proximoToque(3)?.id).toBe("follow_up_1");
    expect(proximoToque(0)?.id).toBe("abordagem");
  });

  it("entre dois toques devolve o seguinte", () => {
    expect(proximoToque(4)?.id).toBe("ligacao_2");
    expect(proximoToque(13)?.id).toBe("follow_up_4");
    expect(proximoToque(17)?.id).toBe("encerramento");
  });

  it("depois do D20 não há nono toque", () => {
    expect(proximoToque(21)).toBeNull();
    expect(cadenciaEncerrada(21)).toBe(true);
    expect(cadenciaEncerrada(20)).toBe(false);
  });

  it("dia negativo cai no primeiro toque em vez de explodir", () => {
    expect(proximoToque(-1)?.id).toBe("abordagem");
  });
});

describe("toquesVencidos / dataDoToque", () => {
  it("no D10 já venceram abordagem, ligação 1, follow-up 1, ligação 2 e follow-up 2", () => {
    expect(toquesVencidos(10).map((t) => t.id)).toEqual([
      "abordagem",
      "ligacao_1",
      "follow_up_1",
      "ligacao_2",
      "follow_up_2",
    ]);
  });

  it("a data de cada toque é a âncora mais o dia, em data civil", () => {
    const inicio = utc("2026-09-01T17:30:00Z");
    const fu1 = CADENCIA_DE_FOLLOW_UP.find((t) => t.id === "follow_up_1")!;
    expect(dataDoToque(inicio, fu1).toISOString()).toBe("2026-09-04T00:00:00.000Z");
  });
});

describe("janelaDoToque", () => {
  it("8h30–11h e 14h–17h em dia útil é permitido", () => {
    expect(janelaDoToque(2, 8, 30)).toBe("permitido");
    expect(janelaDoToque(3, 10, 59)).toBe("permitido");
    expect(janelaDoToque(4, 14, 0)).toBe("permitido");
    expect(janelaDoToque(2, 16, 59)).toBe("permitido");
  });

  it("fora das duas faixas, ou fim de semana, é fora da janela", () => {
    expect(janelaDoToque(2, 8, 29)).toBe("fora_da_janela");
    expect(janelaDoToque(2, 11, 0)).toBe("fora_da_janela");
    expect(janelaDoToque(2, 13, 0)).toBe("fora_da_janela");
    expect(janelaDoToque(2, 17, 0)).toBe("fora_da_janela");
    expect(janelaDoToque(2, 18, 30)).toBe("fora_da_janela");
    expect(janelaDoToque(0, 10, 0)).toBe("fora_da_janela");
    expect(janelaDoToque(6, 15, 0)).toBe("fora_da_janela");
  });

  it("segunda de manhã e sexta à tarde são desaconselhadas, não proibidas", () => {
    expect(janelaDoToque(1, 9, 0)).toBe("desaconselhado");
    expect(janelaDoToque(1, 15, 0)).toBe("permitido");
    expect(janelaDoToque(5, 15, 0)).toBe("desaconselhado");
    expect(janelaDoToque(5, 9, 0)).toBe("permitido");
  });
});
