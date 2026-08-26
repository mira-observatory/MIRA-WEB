import { useState } from "react";
import { copy } from "../../../i18n/copy";
import { formatCount, formatDate, formatMoney } from "../../../lib/format";
import type { QueryColumn } from "../api";
import { columnLabel } from "../columnLabels";

type Row = Record<string, unknown>;

type Props = {
  columns: QueryColumn[];
  rows: Row[];
  rowCount: number;
  truncated: boolean;
  countries?: string[];
};

function cellCountryCode(row: Row): string | undefined {
  const value = row["country_code"];
  return typeof value === "string" ? value : undefined;
}

export function cellCurrencyCode(row: Row, column: QueryColumn): string | null | undefined {
  const own = row["currency_code"];
  return typeof own === "string" ? own : column.currency_code;
}

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

export function uniformCurrency(column: QueryColumn, rows: Row[]): string | null {
  if (column.kind !== "money") return null;
  const codes = [...new Set(rows.map((row) => cellCurrencyCode(row, column) ?? null))];
  return codes.length === 1 ? (codes[0] ?? null) : null;
}

/**
 * Tabla de resultados desplegable al hacer clic en el encabezado.
 */
export function ResultTable({ columns, rows, rowCount, truncated }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-sm transition">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="flex cursor-pointer select-none items-center justify-between gap-2 border-b border-rule bg-paper px-4 py-2.5 hover:bg-paper-sunken/60 transition"
      >
        <div className="flex items-center gap-2 font-mono text-xs font-medium text-ink-soft">
          <span
            aria-hidden="true"
            className={`text-sm font-bold text-ink-faint transition-transform duration-200 ${
              isOpen ? "rotate-90" : ""
            }`}
          >
            ›
          </span>
          <span>
            {formatCount(rowCount)} {rowCount === 1 ? copy.table.singularRow : copy.table.pluralRows}
          </span>
        </div>
      </div>

      {isOpen && (
        <>
          <div className="overflow-x-auto max-w-full">
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule px-4 py-2 text-xs text-ink-soft">
            <span className="font-mono">
              {formatCount(rowCount)} {rowCount === 1 ? copy.table.singularRow : copy.table.pluralRows}
            </span>
            {truncated && (
              <span className="rounded-full bg-maize/15 px-2.5 py-0.5 font-sans font-medium text-[#8a6a15]">
                {copy.table.truncated}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
