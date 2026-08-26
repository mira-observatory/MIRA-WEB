import { describe, expect, it } from "vitest";
import {
  extractMarkdownTables,
  isDelimiterRow,
  parseAlignments,
  parseMarkdownTable,
  splitTableRow,
  tableToCsv,
  tableToHtml,
  tableToTsv,
} from "./tableUtils";

describe("tableUtils", () => {
  it("divide filas de tablas respetando barras invertidas escapadas", () => {
    expect(splitTableRow("| Col 1 | Col 2 |")).toEqual(["Col 1", "Col 2"]);
    expect(splitTableRow("Col 1 | Col 2")).toEqual(["Col 1", "Col 2"]);
    expect(splitTableRow("| Texto con \\| barra | Otro |")).toEqual([
      "Texto con | barra",
      "Otro",
    ]);
  });

  it("identifica filas delimitadoras correctamente", () => {
    expect(isDelimiterRow("|---|---|")).toBe(true);
    expect(isDelimiterRow("|:---|:---:|---:|")).toBe(true);
    expect(isDelimiterRow("---|---")).toBe(true);
    expect(isDelimiterRow("| Juan | 20 |")).toBe(false);
  });

  it("parsea alineaciones de columnas correctamente", () => {
    expect(parseAlignments("|:---|:---:|---:|---|")).toEqual([
      "left",
      "center",
      "right",
      "left",
    ]);
  });

  it("parsea una tabla Markdown estándar completa", () => {
    const raw = `
| Nombre | Edad | Ciudad |
| :--- | :---: | ---: |
| Juan | 20 | Guatemala |
| Carlos | 21 | México |
`;
    const parsed = parseMarkdownTable(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.headers).toEqual(["Nombre", "Edad", "Ciudad"]);
    expect(parsed?.rows).toEqual([
      ["Juan", "20", "Guatemala"],
      ["Carlos", "21", "México"],
    ]);
    expect(parsed?.alignments).toEqual(["left", "center", "right"]);
  });

  it("parsea tablas con celdas vacías o diferente número de columnas", () => {
    const raw = `
| Producto | Precio | Cantidad |
| --- | --- | --- |
| Manzana | 1.50 | |
| Naranja | | 10 |
`;
    const parsed = parseMarkdownTable(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.rows).toEqual([
      ["Manzana", "1.50", ""],
      ["Naranja", "", "10"],
    ]);
  });

  it("extrae múltiples tablas Markdown de un texto largo", () => {
    const text = `
Aquí hay un informe:

| País | Moneda |
| --- | --- |
| Costa Rica | CRC |
| Guatemala | GTQ |

Y aquí hay otra tabla:

| Fruta | Color |
| --- | --- |
| Fresa | Rojo |
| Limón | Verde |
`;
    const tables = extractMarkdownTables(text);
    expect(tables.length).toBe(2);
    expect(tables[0]?.headers).toEqual(["País", "Moneda"]);
    expect(tables[1]?.headers).toEqual(["Fruta", "Color"]);
  });

  it("convierte tablas a formato TSV compatible con Excel/Sheets", () => {
    const headers = ["Nombre", "Edad", "Ciudad"];
    const rows = [
      ["Juan", "20", "Guatemala"],
      ["Carlos", "21", "México"],
    ];
    const tsv = tableToTsv(headers, rows);
    expect(tsv).toBe("Nombre\tEdad\tCiudad\r\nJuan\t20\tGuatemala\r\nCarlos\t21\tMéxico");
  });

  it("convierte tablas a CSV escapando comas, comillas y saltos de línea", () => {
    const headers = ["Nombre", "Descripción", "Monto"];
    const rows = [
      ["Juan", "Contrato, fase 1", "$1,000"],
      ["Carlos", 'Empresa "Alfa"', "$2,500"],
    ];
    const csv = tableToCsv(headers, rows);
    expect(csv).toContain('"Contrato, fase 1"');
    expect(csv).toContain('"$1,000"');
    expect(csv).toContain('"Empresa ""Alfa"""');
  });

  it("genera HTML table seguro para portapapeles", () => {
    const headers = ["Nombre", "Edad"];
    const rows = [["<b>Juan</b>", "20"]];
    const html = tableToHtml(headers, rows);
    expect(html).toContain("&lt;b&gt;Juan&lt;/b&gt;");
    expect(html).not.toContain("<b>Juan</b>");
  });
});

