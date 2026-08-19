import { describe, expect, it } from "vitest";

import type { Outcome, QueryResponse } from "./api";
import { buildHistory, type Turn } from "./useAskConversation";

function turn(overrides: {
  question: string;
  outcome?: Outcome;
  sql?: string | null;
  response?: boolean;
}): Turn {
  const { question, outcome = "OK", sql = "SELECT 1", response = true } = overrides;
  return {
    id: question,
    question,
    countries: ["CR"],
    failed: false,
    response: response ? ({ outcome, sql_executed: sql } as unknown as QueryResponse) : null,
  };
}

describe("buildHistory", () => {
  it("incluye los turnos que devolvieron datos", () => {
    const history = buildHistory([turn({ question: "cuantos procesos hay en Costa Rica" })]);

    expect(history).toEqual([
      {
        question: "cuantos procesos hay en Costa Rica",
        countries: ["CR"],
        sql: "SELECT 1",
      },
    ]);
  });

  it("excluye un turno fuera de dominio -- no hay SQL que continuar", () => {
    const history = buildHistory([
      turn({ question: "capital de Francia", outcome: "OUT_OF_SCOPE", sql: null }),
    ]);

    expect(history).toEqual([]);
  });

  it("excluye SQL que fallo en la base: pasarlo invita a repetirlo", () => {
    const history = buildHistory([turn({ question: "algo pesado", outcome: "FAILED_DB_TIMEOUT" })]);

    expect(history).toEqual([]);
  });

  it("excluye el turno que todavia esta en vuelo", () => {
    expect(buildHistory([turn({ question: "esperando", response: false })])).toEqual([]);
  });

  it("conserva cero filas y narrativa degradada: el SQL sigue siendo valido", () => {
    const history = buildHistory([
      turn({ question: "sin datos", outcome: "OK_ZERO_ROWS" }),
      turn({ question: "narrativa mala", outcome: "OK_DEGRADED_NARRATIVE" }),
    ]);

    expect(history.map((h) => h.question)).toEqual(["sin datos", "narrativa mala"]);
  });

  it("manda a lo sumo los 3 ultimos, que es el tope del backend", () => {
    const history = buildHistory([
      turn({ question: "uno" }),
      turn({ question: "dos" }),
      turn({ question: "tres" }),
      turn({ question: "cuatro" }),
    ]);

    expect(history.map((h) => h.question)).toEqual(["dos", "tres", "cuatro"]);
  });
});
