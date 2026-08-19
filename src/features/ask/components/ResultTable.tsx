import { formatCount, formatDate, formatMoney } from "../../../lib/format";
import type { QueryColumn } from "../api";

type Row = Record<string, unknown>;

type Props = {
  columns: QueryColumn[];
  rows: Row[];
  rowCount: number;
  truncated: boolean;
};

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
      return value === null || value === undefined || value === "" ? "—" : String(value);
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
export function ResultTable({ columns, rows, rowCount, truncated }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-sm">
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
                  {column.name}
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
          {formatCount(rowCount)} {rowCount === 1 ? "fila" : "filas"}
        </span>
        {truncated && (
          <span className="rounded-full bg-maize/15 px-2.5 py-1 font-sans font-medium text-[#8a6a15]">
            Resultado truncado -- hay mas filas de las que se muestran aqui
          </span>
        )}
      </div>
    </div>
  );
}
