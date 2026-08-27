import { describe, expect, it } from "vitest";

import {
  buildManualSearchQuestion,
  EMPTY_MANUAL_SEARCH_FILTERS,
  hasMixedCurrencyAmountRisk,
  type ManualSearchFilters,
  validateManualSearchFilters,
  withEntityType,
} from "./manualSearch";

function filters(overrides: Partial<ManualSearchFilters> = {}): ManualSearchFilters {
  return { ...EMPTY_MANUAL_SEARCH_FILTERS, ...overrides };
}

describe("buildManualSearchQuestion", () => {
  it("compone todos los filtros en orden estable y conserva los estados normalizados", () => {
    const question = buildManualSearchQuestion(
      filters({
        dateFrom: "2026-01-01",
        dateTo: "2026-03-31",
        statuses: ["AWARDED", "OPEN"],
        procurementMethod: "  Compra   Directa  ",
        entityType: "buyer",
        entityName: 'Ministerio de "Salud"',
        amountMin: "1000",
        amountMax: "5000",
      }),
      ["GT", "CR"],
    );

    expect(question).toBe(
      'Busca procesos de contratación en Guatemala y Costa Rica; publicados entre 2026-01-01 y 2026-03-31; con estados normalizados OPEN y AWARDED; cuya modalidad de contratación contenga "Compra Directa"; del comprador llamado "Ministerio de \'Salud\'"; con monto registrado entre 1000 y 5000; en la moneda reportada por cada país, sin convertir ni sumar monedas.',
    );
  });

  it("compone filtros abiertos y proveedor sin inventar límites ausentes", () => {
    const question = buildManualSearchQuestion(
      filters({
        dateFrom: "2025-05-01",
        entityType: "supplier",
        entityName: "Proveedor Uno",
        amountMin: "250",
      }),
      ["HN"],
    );

    expect(question).toContain("publicados desde 2025-05-01");
    expect(question).toContain('adjudicados al proveedor llamado "Proveedor Uno"');
    expect(question).toContain("monto registrado de al menos 250");
    expect(question).not.toContain("hasta");
  });

  it("genera una consulta general cuando no se marca ningun filtro", () => {
    expect(buildManualSearchQuestion(filters(), ["NI"])).toBe(
      "Busca procesos de contratación en Nicaragua.",
    );
  });
});

describe("manual search validation", () => {
  it("conserva el nombre al alternar entre comprador y proveedor", () => {
    const current = filters({ entityType: "buyer", entityName: "Ministerio de Salud" });

    expect(withEntityType(current, "supplier")).toMatchObject({
      entityType: "supplier",
      entityName: "Ministerio de Salud",
    });
  });

  it("rechaza rangos invertidos", () => {
    expect(
      validateManualSearchFilters(filters({ dateFrom: "2026-04-01", dateTo: "2026-03-01" }), [
        "GT",
      ]),
    ).toContain("fecha inicial");
    expect(
      validateManualSearchFilters(filters({ amountMin: "500", amountMax: "100" }), ["GT"]),
    ).toContain("monto mínimo");
  });

  it("advierte por moneda mixta solo al filtrar montos en varios paises", () => {
    expect(hasMixedCurrencyAmountRisk(filters({ amountMin: "10" }), ["GT", "CR"])).toBe(true);
    expect(hasMixedCurrencyAmountRisk(filters({ amountMin: "10" }), ["GT"])).toBe(false);
    expect(hasMixedCurrencyAmountRisk(filters(), ["GT", "CR"])).toBe(false);
  });
});
