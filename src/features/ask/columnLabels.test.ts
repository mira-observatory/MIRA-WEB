import { describe, expect, it } from "vitest";

import { columnLabel } from "./columnLabels";

describe("columnLabel", () => {
  it("traduce las columnas reales de query.* a español natural", () => {
    expect(columnLabel("process_id")).toBe("Proceso");
    expect(columnLabel("award_id")).toBe("Adjudicación");
    expect(columnLabel("awarded_amount")).toBe("Monto adjudicado");
    expect(columnLabel("currency_code")).toBe("Moneda");
    expect(columnLabel("country_code")).toBe("País");
  });

  it("nunca muestra un snake_case desnudo para una columna desconocida", () => {
    expect(columnLabel("algun_alias_nuevo")).toBe("Algun alias nuevo");
    expect(columnLabel("promedio")).toBe("Promedio");
  });
});
