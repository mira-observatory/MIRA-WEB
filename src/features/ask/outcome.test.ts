import { describe, expect, it } from "vitest";

import { classifyOutcome } from "./outcome";

describe("classifyOutcome", () => {
  it("agrupa los outcomes de exito", () => {
    expect(classifyOutcome("OK")).toBe("ok");
    expect(classifyOutcome("OK_ZERO_ROWS")).toBe("zero");
    expect(classifyOutcome("OK_DEGRADED_NARRATIVE")).toBe("degraded");
  });

  it("distingue fuera de dominio de rechazado por el validador", () => {
    expect(classifyOutcome("OUT_OF_SCOPE")).toBe("out_of_scope");
    expect(classifyOutcome("REJECTED_SQL_RELATION")).toBe("rejected");
    expect(classifyOutcome("REJECTED_SQL_COUNTRY_SCOPE")).toBe("rejected");
    expect(classifyOutcome("REJECTED_ENTITY_AMBIGUOUS")).toBe("rejected");
  });

  it("agrupa fallos de infraestructura como failed", () => {
    expect(classifyOutcome("FAILED_DB_TIMEOUT")).toBe("failed");
    expect(classifyOutcome("FAILED_DB_ERROR")).toBe("failed");
    expect(classifyOutcome("FAILED_LLM_ERROR")).toBe("failed");
  });

  it("agrupa limitacion de cuota y presupuesto como throttled", () => {
    expect(classifyOutcome("THROTTLED_BUDGET")).toBe("throttled");
    expect(classifyOutcome("THROTTLED_QUOTA")).toBe("throttled");
  });
});
