import { describe, expect, it } from "vitest";

import type { QueryColumn } from "../api";
import { formatCell, toNumber, uniformCurrency } from "./ResultTable";

describe("toNumber", () => {
  it("acepta un number nativo", () => {
    expect(toNumber(7992)).toBe(7992);
  });

  it("acepta un Decimal serializado como string -- caso real de awarded_amount", () => {
    // Postgres `numeric` llega como Decimal de Python, que FastAPI serializa
    // como string de JSON (no como number) para no perder precision.
    // Verificado en vivo el 2026-08-19 contra produccion.
    expect(toNumber("12414179727.24")).toBeCloseTo(12414179727.24);
  });

  it("devuelve null para valores no numericos", () => {
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber("MIRA-CR-AWARD-BA79BA102334")).toBeNull();
    expect(toNumber("")).toBeNull();
  });
});

const moneyColumn: QueryColumn = { name: "awarded_amount", kind: "money", currency_code: "USD" };

describe("uniformCurrency", () => {
  it("devuelve la moneda cuando todas las filas coinciden", () => {
    const rows = [{ currency_code: "USD" }, { currency_code: "USD" }];
    expect(uniformCurrency(moneyColumn, rows)).toBe("USD");
  });

  it("devuelve null cuando las filas mezclan monedas -- v_awards lo permite a proposito", () => {
    const rows = [{ currency_code: "USD" }, { currency_code: "EUR" }];
    expect(uniformCurrency(moneyColumn, rows)).toBeNull();
  });

  it("no aplica a columnas que no son de dinero", () => {
    const textColumn: QueryColumn = { name: "award_id", kind: "text", currency_code: null };
    expect(uniformCurrency(textColumn, [{ currency_code: "USD" }])).toBeNull();
  });
});

describe("formatCell", () => {
  it("nunca confunde un id de texto con un numero", () => {
    const idColumn: QueryColumn = { name: "award_id", kind: "text", currency_code: null };
    expect(formatCell("MIRA-CR-AWARD-BA79BA102334", idColumn, undefined, undefined)).toBe(
      "MIRA-CR-AWARD-BA79BA102334",
    );
  });

  it("usa la moneda propia de la fila, no una fija por columna", () => {
    // Esta es la garantia central: aunque `column.currency_code` diga "USD"
    // (la moneda de la primera fila), una fila en EUR nunca debe mostrar "US$".
    const formatted = formatCell("12414179727.24", moneyColumn, undefined, "EUR");
    expect(formatted).toContain("€");
    expect(formatted).not.toContain("US$");
  });

  it("muestra un guion largo para valores de texto ausentes", () => {
    const textColumn: QueryColumn = { name: "title", kind: "text", currency_code: null };
    expect(formatCell(null, textColumn, undefined, undefined)).toBe("—");
    expect(formatCell("", textColumn, undefined, undefined)).toBe("—");
  });
});
