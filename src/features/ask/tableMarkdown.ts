import { copy } from "../../i18n/copy";
import { columnLabel } from "./columnLabels";
import type { QueryColumn } from "./api";
import { cellCurrencyCode, formatCell, uniformCurrency } from "./components/ResultTable";

type Row = Record<string, unknown>;

/** Los codigos ISO llegan del backend en mayuscula; el catalogo los indexa en minuscula. */
export function countryLabel(code: string): string {
  const entry = copy.countries.byId[code.toLowerCase() as keyof typeof copy.countries.byId];
  return entry ? entry.name : code.toUpperCase();
}

/**
 * La bandera del pais, del mismo juego de SVG que usa el selector.
 *
 * Va solo en la tabla en pantalla, nunca en el Markdown exportado: una ruta
 * relativa como /flags/cr.svg no resuelve en ningun lado donde se pegue el
 * informe, y una imagen rota se ve peor que ninguna imagen.
 */
export const GENERIC_FLAG_ASSET = "/flags/generic.svg";

export function countryFlagAsset(code: string): string {
  return `/flags/${code.toLowerCase()}.svg`;
}

/**
 * El titulo de la tabla. Con un pais es su nombre -- se sabe de que estamos
 * hablando sin leer una columna. Con varios no se nombra ninguno: la
 * atribucion fila por fila la da la columna de pais, que el prompt obliga a
 * incluir cuando se consulta mas de uno.
 */
export function tableTitle(countries: string[]): string {
  const [unico] = countries;
  if (countries.length === 1 && unico) return countryLabel(unico);
  if (countries.length === 0) return copy.table.titleNoCountry;
  return copy.table.titleManyCountries.replace("{n}", String(countries.length));
}

/** Las barras verticales parten la tabla en dos columnas donde no toca. */
function escapeCell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n+/g, " ");
}

function headerLabel(column: QueryColumn, rows: Row[]): string {
  const currency = uniformCurrency(column, rows);
  return currency ? `${columnLabel(column.name)} (${currency})` : columnLabel(column.name);
}

/**
 * La tabla en Markdown, para pegarla en un informe, un issue o un mensaje.
 *
 * Usa exactamente el mismo `formatCell` que la tabla en pantalla, no una
 * copia: si los montos se formatean distinto al exportarlos, alguien va a
 * comparar el informe contra la pantalla y va a encontrar dos cifras que no
 * coinciden. La fuente de la verdad tiene que ser una sola.
 */
export function toMarkdown(
  columns: QueryColumn[],
  rows: Row[],
  countries: string[],
  rowCount: number,
  truncated: boolean,
): string {
  const encabezado = columns.map((c) => escapeCell(headerLabel(c, rows)));
  const separador = columns.map(() => "---");
  const cuerpo = rows.map((row) =>
    columns.map((column) => {
      const pais = typeof row["country_code"] === "string" ? row["country_code"] : undefined;
      return escapeCell(formatCell(row[column.name], column, pais, cellCurrencyCode(row, column)));
    }),
  );

  const lineas = [
    `### ${tableTitle(countries)}`,
    "",
    `| ${encabezado.join(" | ")} |`,
    `| ${separador.join(" | ")} |`,
    ...cuerpo.map((fila) => `| ${fila.join(" | ")} |`),
    "",
    truncated
      ? `_${rowCount} ${rowCount === 1 ? copy.table.singularRow : copy.table.pluralRows} — ${copy.table.truncated}_`
      : `_${rowCount} ${rowCount === 1 ? copy.table.singularRow : copy.table.pluralRows}_`,
  ];
  return lineas.join("\n");
}
