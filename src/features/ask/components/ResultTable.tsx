import { useState } from "react";
import { formatCount, formatDate, formatMoney } from "../../../lib/format";
import { copy } from "../../../i18n/copy";
import { columnLabel } from "../columnLabels";
import {
  GENERIC_FLAG_ASSET,
  countryFlagAsset,
  tableTitle,
  toMarkdown,
} from "../tableMarkdown";
import type { QueryColumn } from "../api";

type Row = Record<string, unknown>;

type Props = {
  columns: QueryColumn[];
  rows: Row[];
  rowCount: number;
  truncated: boolean;
  //: Los paises que se consultaron, para titular la tabla. Vienen de la
  //: peticion y no de las filas: si Guatemala se pidio y no devolvio nada,
  //: el titulo tiene que seguir diciendo que se pregunto por Guatemala.
  countries: string[];
};

/**
 * Copia la tabla en Markdown al portapapeles.
 *
 * El boton confirma en su propia etiqueta y vuelve solo a los dos segundos:
 * copiar no deja rastro visible en la pagina, y sin confirmacion la gente
 * hace clic dos o tres veces sin saber si funciono.
 */
function CopyMarkdownButton({ getMarkdown }: { getMarkdown: () => string }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(getMarkdown());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles (o sin HTTPS) no hay nada que hacer desde
      // aqui. Mejor no hacer nada que mentir con un "Copiado".
    }
  };

  return (
    <button
      type="button"
      onClick={copiar}
      className="rounded-full border border-rule px-2.5 py-1 font-sans text-[11px] font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink"
    >
      {copiado ? copy.table.copied : copy.table.copyMarkdown}
    </button>
  );
}

function cellCountryCode(row: Row): string | undefined {
  const value = row["country_code"];
  return typeof value === "string" ? value : undefined;
}

/**
 * `Column.currency_code` es solo la moneda de la PRIMERA fila (asi lo arma el
 * backend) -- una guia, no una garantia de que toda la columna comparte
 * moneda. Cuando la fila trae su propio campo `currency_code` (como
 * `v_awards`, que mezcla monedas a proposito), ese es el que manda: mostrar
 * "US$" en una fila que en realidad esta en EUR seria mentir.
 */
export function cellCurrencyCode(row: Row, column: QueryColumn): string | null | undefined {
  const own = row["currency_code"];
  return typeof own === "string" ? own : column.currency_code;
}

/**
 * Las columnas `numeric` de Postgres llegan como Decimal de Python, y ese
 * tipo se serializa como string de JSON (no como number) para no perder
 * precision -- verificado en vivo: `awarded_amount` llega como
 * `"12414179727.24"`, no como `12414179727.24`. `count(*)` en cambio es un
 * bigint y sí llega como number nativo. Hay que aceptar ambos.
 */
export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function formatCell(
  value: unknown,
  column: QueryColumn,
  countryCode: string | undefined,
  currencyCode: string | null | undefined,
): string {
  switch (column.kind) {
    case "money":
      return formatMoney(toNumber(value), currencyCode, countryCode);
    case "date":
      return formatDate(typeof value === "string" ? value : null, countryCode);
    case "number":
      return formatCount(toNumber(value));
    default:
      return value === null || value === undefined || value === ""
        ? copy.table.emptyCell
        : String(value);
  }
}

/**
 * Solo para el encabezado: si TODAS las filas comparten la misma moneda en
 * esta columna, mostrarla ahi es un atajo util. Si estan mezcladas (v_awards
 * lo permite a proposito), no se muestra nada arriba -- el simbolo correcto
 * ya va en cada celda via formatMoney, y poner una sola moneda en el
 * encabezado seria sugerir que toda la columna comparte una que no comparte.
 */
export function uniformCurrency(column: QueryColumn, rows: Row[]): string | null {
  if (column.kind !== "money") return null;
  const codes = [...new Set(rows.map((row) => cellCurrencyCode(row, column) ?? null))];
  return codes.length === 1 ? (codes[0] ?? null) : null;
}

/**
 * Todo lo que sale de la base va en font-mono (regla del proyecto: la
 * tipografia monoespaciada marca lo que viene de la base, la serif marca lo
 * que escribe el modelo). Esta tabla nunca renderiza narrativa.
 */
export function ResultTable({ columns, rows, rowCount, truncated, countries }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-paper px-4 py-2.5">
        <h4 className="flex items-center gap-2 font-display text-sm font-semibold text-ink">
          {countries.length === 1 && countries[0] ? (
            <img
              className="h-3.5 w-5 rounded-[2px] object-cover"
              src={countryFlagAsset(countries[0])}
              alt=""
              aria-hidden="true"
              onError={(event) => {
                if (event.currentTarget.src.endsWith(GENERIC_FLAG_ASSET)) return;
                event.currentTarget.src = GENERIC_FLAG_ASSET;
              }}
            />
          ) : null}
          {tableTitle(countries)}
        </h4>
        <CopyMarkdownButton
          getMarkdown={() => toMarkdown(columns, rows, countries, rowCount, truncated)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule bg-paper text-left text-xs uppercase tracking-wide text-ink-soft">
              {columns.map((column) => (
                <th
                  key={column.name}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 font-sans font-semibold"
                >
                  {columnLabel(column.name)}
                  {(() => {
                    const currency = uniformCurrency(column, rows);
                    return currency ? (
                      <span className="ml-1.5 font-mono text-[11px] font-normal normal-case text-ink-faint">
                        {currency}
                      </span>
                    ) : null;
                  })()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-rule/60 last:border-0 even:bg-paper/50">
                {columns.map((column) => (
                  <td
                    key={column.name}
                    className="whitespace-nowrap px-4 py-2.5 font-mono text-ink"
                  >
                    {formatCell(
                      row[column.name],
                      column,
                      cellCountryCode(row),
                      cellCurrencyCode(row, column),
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule px-4 py-2.5 text-xs text-ink-soft">
        <span className="font-mono">
          {formatCount(rowCount)} {rowCount === 1 ? copy.table.singularRow : copy.table.pluralRows}
        </span>
        {truncated && (
          <span className="rounded-full bg-maize/15 px-2.5 py-1 font-sans font-medium text-[#8a6a15]">
            {copy.table.truncated}
          </span>
        )}
      </div>
    </div>
  );
}
