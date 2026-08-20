import { describe, expect, it } from "vitest";

import type { Outcome } from "./api";
import { applyEvent, buildHistory, type Turn } from "./useAskConversation";

function turn(overrides: Partial<Turn> = {}): Turn {
  return {
    id: "t1",
    question: "cuantos procesos hay en Costa Rica",
    countries: ["CR"],
    phase: "done",
    sql: "SELECT 1",
    columns: [],
    rows: [],
    rowCount: 0,
    truncated: false,
    narrative: null,
    narrativeVerified: false,
    outcome: "OK" as Outcome,
    warnings: [],
    failed: false,
    ...overrides,
  };
}

describe("applyEvent", () => {
  it("avanza de fase conforme llega el stream", () => {
    let t = turn({ phase: "translating", sql: null, outcome: null });

    t = applyEvent(t, { type: "sql", sql: "SELECT COUNT(*)" });
    expect(t.phase).toBe("querying");
    expect(t.sql).toBe("SELECT COUNT(*)");

    t = applyEvent(t, { type: "row_count", rowCount: 3, truncated: false });
    expect(t.phase).toBe("querying"); // row_count aun no trae las filas
    expect(t.rowCount).toBe(3);

    t = applyEvent(t, { type: "rows", columns: [], rows: [{ a: 1 }] });
    expect(t.phase).toBe("writing");

    t = applyEvent(t, { type: "done", outcome: "OK" as Outcome });
    expect(t.phase).toBe("done");
  });

  it("un evento error no cierra el turno -- el backend manda done despues", () => {
    const t = applyEvent(turn({ phase: "translating" }), {
      type: "error",
      outcome: "OUT_OF_SCOPE" as Outcome,
    });

    expect(t.outcome).toBe("OUT_OF_SCOPE");
    expect(t.phase).toBe("translating");
  });

  it("guarda el aviso de cobertura que explica un resultado vacio", () => {
    const t = applyEvent(turn(), {
      type: "warnings",
      warnings: [{ code: "PARTIAL_COVERAGE", message_es: "todavia no hay adjudicaciones" }],
    });

    expect(t.warnings).toHaveLength(1);
    expect(t.warnings[0]!.code).toBe("PARTIAL_COVERAGE");
  });

  it("guarda la narrativa con su marca de verificacion", () => {
    const t = applyEvent(turn(), { type: "narrative", text: "Con gusto…", verified: true });

    expect(t.narrative).toBe("Con gusto…");
    expect(t.narrativeVerified).toBe(true);
  });
});

describe("buildHistory", () => {
  it("incluye los turnos que devolvieron datos", () => {
    expect(buildHistory([turn()])).toEqual([
      { question: "cuantos procesos hay en Costa Rica", countries: ["CR"], sql: "SELECT 1" },
    ]);
  });

  it("excluye un turno fuera de dominio -- no hay SQL que continuar", () => {
    const history = buildHistory([turn({ outcome: "OUT_OF_SCOPE" as Outcome, sql: null })]);
    expect(history).toEqual([]);
  });

  it("excluye SQL que fallo en la base: pasarlo invita a repetirlo", () => {
    expect(buildHistory([turn({ outcome: "FAILED_DB_TIMEOUT" as Outcome })])).toEqual([]);
  });

  it("excluye el turno que todavia esta en vuelo", () => {
    expect(buildHistory([turn({ phase: "writing" })])).toEqual([]);
  });

  it("conserva cero filas y narrativa degradada: el SQL siguio siendo valido", () => {
    const history = buildHistory([
      turn({ id: "a", question: "sin datos", outcome: "OK_ZERO_ROWS" as Outcome }),
      turn({ id: "b", question: "narrativa mala", outcome: "OK_DEGRADED_NARRATIVE" as Outcome }),
    ]);

    expect(history.map((h) => h.question)).toEqual(["sin datos", "narrativa mala"]);
  });

  it("manda a lo sumo los 3 ultimos, que es el tope del backend", () => {
    const history = buildHistory([
      turn({ id: "1", question: "uno" }),
      turn({ id: "2", question: "dos" }),
      turn({ id: "3", question: "tres" }),
      turn({ id: "4", question: "cuatro" }),
    ]);

    expect(history.map((h) => h.question)).toEqual(["dos", "tres", "cuatro"]);
  });
});
