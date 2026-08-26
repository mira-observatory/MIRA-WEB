import { describe, expect, it } from "vitest";

import { drainFrames, parseFrame, warningText } from "./stream";

describe("drainFrames", () => {
  it("separa frames completos y devuelve el resto a medias", () => {
    const { frames, rest } = drainFrames("event: a\ndata: {}\n\nevent: b\ndata: {");

    expect(frames).toEqual(["event: a\ndata: {}"]);
    expect(rest).toBe("event: b\ndata: {");
  });

  it("un frame partido entre dos chunks no se pierde", () => {
    // Es el caso real: la red corta donde quiere, no en los limites del frame.
    const primero = drainFrames('event: row_count\ndata: {"row_c');
    expect(primero.frames).toEqual([]);

    const segundo = drainFrames(primero.rest + 'ount": 3, "truncated": false}\n\n');
    expect(segundo.frames).toHaveLength(1);
    expect(parseFrame(segundo.frames[0]!)).toEqual({
      type: "row_count",
      rowCount: 3,
      truncated: false,
    });
  });
});

describe("parseFrame", () => {
  it("lee el evento de filas", () => {
    const frame = 'event: rows\ndata: {"columns": [], "rows": [{"total": 7992}]}';

    expect(parseFrame(frame)).toEqual({
      type: "rows",
      columns: [],
      rows: [{ total: 7992 }],
    });
  });

  it("lee la narrativa con su marca de verificacion", () => {
    const frame = 'event: narrative\ndata: {"text": "Con gusto…", "verified": true}';

    expect(parseFrame(frame)).toEqual({
      type: "narrative",
      text: "Con gusto…",
      verified: true,
    });
  });

  it("ignora un evento que no conoce en vez de romper el stream", () => {
    expect(parseFrame('event: algo_nuevo\ndata: {"x": 1}')).toBeNull();
  });

  it("ignora datos que no son JSON valido", () => {
    expect(parseFrame("event: rows\ndata: {roto")).toBeNull();
  });

  it("ignora un frame sin datos", () => {
    expect(parseFrame("event: rows")).toBeNull();
  });
});

describe("warningText", () => {
  const aviso = { code: "PARTIAL_COVERAGE", message_es: "vacío", message_en: "empty" };

  it("elige el texto segun el idioma de la respuesta", () => {
    expect(warningText(aviso, "en")).toBe("empty");
    expect(warningText(aviso, "es")).toBe("vacío");
  });

  it("sin traduccion cae al espanol en vez de quedar vacio", () => {
    // Con cero filas el aviso ES la respuesta: dejarlo en blanco seria peor
    // que mostrarlo en el otro idioma.
    expect(warningText({ code: "X", message_es: "solo español" }, "en")).toBe("solo español");
  });

  it("un backend sin idioma se asume espanol", () => {
    const evento = parseFrame('event: warnings\ndata: {"warnings":[]}');
    expect(evento).toEqual({ type: "warnings", warnings: [], language: "es" });
  });
});
