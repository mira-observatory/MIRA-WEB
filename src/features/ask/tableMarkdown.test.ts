import { describe, expect, it } from "vitest";
import type { QueryColumn } from "./api";
import { formatCell } from "./components/ResultTable";
import {
  countryFlagAsset,
  countryLabel,
  tableTitle,
  toHtmlTable,
  toMarkdown,
  toTsv,
} from "./tableMarkdown";

const COLUMNAS: QueryColumn[] = [
  { name: "process_id", kind: "text", currency_code: null },
  { name: "awarded_amount", kind: "money", currency_code: "CRC" },
];

describe("tableTitle", () => {
  it("con un pais lo nombra", () => {
    // Sin bandera en el texto: la bandera es un SVG que pinta la tabla al
    // lado del titulo, no un caracter. En el Markdown exportado no va, porque
    // una ruta /flags/cr.svg no resuelve donde se pegue el informe.
    expect(tableTitle(["CR"])).toBe("Costa Rica");
  });

  it("acepta el codigo en mayuscula que manda el backend", () => {
    // El backend devuelve 'GT'; el catalogo esta indexado en minuscula. Que
    // esto falle daria un titulo "GT" en vez de "Guatemala".
    expect(countryLabel("GT")).toBe("Guatemala");
  });

  it("la bandera apunta al mismo juego de SVG que usa el selector", () => {
    expect(countryFlagAsset("CR")).toBe("/flags/cr.svg");
  });

  it("con varios no nombra ninguno: cual es cual lo dice la columna", () => {
    expect(tableTitle(["CR", "GT"])).toBe("2 países");
  });

  it("un codigo desconocido no rompe el titulo", () => {
    expect(tableTitle(["ZZ"])).toBe("ZZ");
  });
});

describe("toMarkdown", () => {
  const filas = [
    { process_id: "MIRA-CR-1", awarded_amount: "1500", country_code: "CR" },
    { process_id: "MIRA-CR-2", awarded_amount: "2500", country_code: "CR" },
  ];

  it("arma una tabla valida con titulo y pie", () => {
    const md = toMarkdown(COLUMNAS, filas, ["CR"], 2, false);
    const lineas = md.split("\n");

    expect(lineas[0]).toBe("### Costa Rica");
    expect(lineas[3]).toBe("| --- | --- |");
    expect(lineas.filter((l) => l.startsWith("| MIRA-CR-"))).toHaveLength(2);
    expect(md).toContain("_2 filas_");
  });

  /** Las celdas que ve un parser de Markdown: una barra escapada no separa. */
  const celdas = (linea: string): number => linea.split(/(?<!\\)\|/).length - 2;

  it("cada fila tiene tantas celdas como columnas", () => {
    const md = toMarkdown(COLUMNAS, filas, ["CR"], 2, false);
    for (const linea of md.split("\n").filter((l) => l.startsWith("|"))) {
      expect(celdas(linea)).toBe(COLUMNAS.length);
    }
  });

  it("escapa las barras verticales del contenido", () => {
    // Un titulo de licitacion con '|' partiria la fila en una columna de mas
    // y desalinearia toda la tabla al pegarla.
    const md = toMarkdown(COLUMNAS, [{ process_id: "A|B", awarded_amount: "1" }], ["CR"], 1, false);
    const fila = md.split("\n").find((l) => l.includes("A"));

    expect(fila).toContain("A\\|B");
    expect(celdas(fila!)).toBe(COLUMNAS.length);
  });

  it("dice cuando el resultado esta truncado", () => {
    const md = toMarkdown(COLUMNAS, filas, ["CR"], 500, true);
    expect(md).toContain("truncado");
  });

  it("formatea los montos con el mismo formateador que la tabla en pantalla", () => {
    // Si el informe y la pantalla muestran cifras distintas, alguien las va a
    // comparar y va a creer que una de las dos miente. Se compara contra
    // formatCell y no contra un literal: el separador de miles depende del
    // locale, y clavarlo aqui probaria el locale, no la coherencia.
    const md = toMarkdown(COLUMNAS, filas, ["CR"], 2, false);
    const esperado = formatCell(filas[0]!.awarded_amount, COLUMNAS[1]!, "CR", "CRC");

    expect(md).toContain(esperado);
    expect(md).not.toContain("| 1500 |");
  });
});

describe("toTsv", () => {
  const filas = [
    { process_id: "MIRA-CR-1", awarded_amount: "1500", country_code: "CR" },
    { process_id: "MIRA-CR-2", awarded_amount: "2500", country_code: "CR" },
  ];

  it("genera filas separadas por tabulaciones para pegar en Excel", () => {
    const tsv = toTsv(COLUMNAS, filas);
    const lineas = tsv.split("\r\n");

    expect(lineas).toHaveLength(3);
    expect(lineas[0]?.split("\t")).toHaveLength(COLUMNAS.length);
    expect(lineas[1]?.split("\t")).toHaveLength(COLUMNAS.length);
    expect(lineas[1]).toContain("MIRA-CR-1");
  });
});

describe("toHtmlTable", () => {
  const filas = [
    { process_id: "MIRA-CR-1", awarded_amount: "1500", country_code: "CR" },
  ];

  it("genera un fragmento table HTML con thead y tbody", () => {
    const html = toHtmlTable(COLUMNAS, filas);
    expect(html).toContain("<table><thead><tr><th>");
    expect(html).toContain("<tbody><tr><td>");
    expect(html).toContain("MIRA-CR-1");
  });
});

