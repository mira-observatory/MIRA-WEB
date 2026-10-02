import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon, MoreHorizontalIcon } from "../../../components/icons";
import { useCopy } from "../../../i18n";
import {
  copyTableToClipboard,
  downloadCsvFile,
  extractMarkdownTables,
  tableToCsv,
} from "../../../components/markdown/tableUtils";
import type { QueryColumn } from "../api";
import { formatCell } from "./ResultTable";
import { columnLabel } from "../columnLabels";
import { CopyTextButton } from "./CopyTextButton";

type Props = {
  text: string;
  columns?: QueryColumn[];
  rows?: Record<string, unknown>[];
  className?: string;
};

/**
 * Controles de acción al pie de cada respuesta de la IA (Copiar, Menú ⋯ con Descargar CSV).
 */
export function AnswerActions({ text, columns = [], rows = [], className = "" }: Props) {
  const copy = useCopy();
  const [tableCopyState, setTableCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Detecta si la respuesta contiene tablas Markdown
  const markdownTables = extractMarkdownTables(text);
  const hasStructuredTable = columns.length > 0 && rows.length > 0;
  const hasTable = markdownTables.length > 0 || hasStructuredTable;

  useEffect(() => {
    if (tableCopyState === "idle") return;
    const timer = window.setTimeout(() => setTableCopyState("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [tableCopyState]);

  // Cierra el menú al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  /**
   * Extrae los datos tabulares disponibles (desde Markdown o desde columnas/filas estructuradas).
   */
  const getTableData = (): { headers: string[]; rows: string[][] } | null => {
    if (markdownTables.length > 0 && markdownTables[0]) {
      return {
        headers: markdownTables[0].headers,
        rows: markdownTables[0].rows,
      };
    }
    if (hasStructuredTable) {
      const headers = columns.map((c) => columnLabel(c.name));
      const tableRows = rows.map((row) =>
        columns.map((column) => {
          const pais = typeof row["country_code"] === "string" ? row["country_code"] : undefined;
          const currency =
            typeof row["currency_code"] === "string" ? row["currency_code"] : column.currency_code;
          return formatCell(row[column.name], column, pais, currency);
        }),
      );
      return { headers, rows: tableRows };
    }
    return null;
  };

  /**
   * Copia exclusivamente los datos tabulares en formato TSV/HTML.
   */
  const handleCopy = async () => {
    const tableData = getTableData();
    if (!tableData) return;
    const success = await copyTableToClipboard(tableData.headers, tableData.rows);
    setTableCopyState(success ? "copied" : "failed");
  };

  /**
   * Acción de Descargar como CSV
   */
  const handleDownloadCsv = () => {
    const tableData = getTableData();
    if (tableData) {
      const csv = tableToCsv(tableData.headers, tableData.rows);
      downloadCsvFile(csv);
    }
    setMenuOpen(false);
  };

  return (
    <div className={`relative flex flex-wrap items-center gap-1.5 pt-1 text-ink-soft ${className}`}>
      {text && <CopyTextButton text={text} label={copy.askTurn.actions.copyResponse} />}
      {hasTable && (
        <button
          type="button"
          onClick={handleCopy}
          title={copy.askTurn.actions.copyTable}
          aria-label={
            tableCopyState === "copied"
              ? copy.askTurn.actions.copied
              : copy.askTurn.actions.copyTable
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-rule/60 bg-paper px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-isthmus/40 hover:bg-paper-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-isthmus"
        >
          {tableCopyState === "copied" ? (
            <>
              <CheckIcon size={14} className="text-quetzal" />
              <span className="text-[11px] font-semibold text-quetzal">
                {copy.askTurn.actions.copied}
              </span>
            </>
          ) : (
            <>
              <CopyIcon size={14} />
              <span aria-live="polite" className="text-[11px]">
                {tableCopyState === "failed"
                  ? copy.askTurn.actions.copyFailed
                  : copy.askTurn.actions.copyTable}
              </span>
            </>
          )}
        </button>
      )}

      {/* Botón Menú ⋯ (acciones para tablas) */}
      {hasTable && (
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            title={copy.askTurn.actions.moreOptions}
            aria-label={copy.askTurn.actions.moreOptions}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rule/60 bg-paper text-ink-soft transition hover:border-isthmus/40 hover:bg-paper-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-isthmus"
          >
            <MoreHorizontalIcon size={16} />
          </button>

          {/* Menú Contextual Desplegable */}
          {menuOpen && (
            <div
              ref={menuRef}
              role="menu"
              aria-orientation="vertical"
              className="absolute left-0 bottom-full mb-1.5 z-30 min-w-[170px] rounded-xl border border-rule bg-paper-raised p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleDownloadCsv}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-ink transition hover:bg-paper-sunken"
              >
                <DownloadIcon size={14} className="text-ink-soft" />
                <span>{copy.askTurn.actions.downloadCsv}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
