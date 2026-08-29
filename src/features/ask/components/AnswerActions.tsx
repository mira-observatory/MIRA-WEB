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
  const [copiado, setCopiado] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Detecta si la respuesta contiene tablas Markdown
  const markdownTables = extractMarkdownTables(text);
  const hasStructuredTable = columns.length > 0 && rows.length > 0;
  const hasTable = markdownTables.length > 0 || hasStructuredTable;

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
          const currency = typeof row["currency_code"] === "string" ? row["currency_code"] : column.currency_code;
          return formatCell(row[column.name], column, pais, currency);
        })
      );
      return { headers, rows: tableRows };
    }
    return null;
  };

  /**
   * Acción del botón Copiar:
   * Si hay tabla, copia en formato TSV/HTML para Excel/Sheets.
   * Si no hay tabla, copia el texto plano.
   */
  const handleCopy = async () => {
    const tableData = getTableData();
    let success = false;

    if (tableData) {
      success = await copyTableToClipboard(tableData.headers, tableData.rows);
    }

    if (!success) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
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
    <div className={`relative flex items-center gap-1.5 pt-1 text-ink-soft ${className}`}>
      {/* Botón Principal: Copiar */}
      <button
        type="button"
        onClick={handleCopy}
        title={hasTable ? "Copiar tabla para Excel / Sheets" : "Copiar respuesta"}
        aria-label={copiado ? "Copiado" : "Copiar"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-rule/60 bg-paper px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-isthmus/40 hover:bg-paper-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-isthmus"
      >
        {copiado ? (
          <>
            <CheckIcon size={14} className="text-quetzal" />
            <span className="text-[11px] font-semibold text-quetzal">{copy.askTurn.actions.copied}</span>
          </>
        ) : (
          <>
            <CopyIcon size={14} />
            <span className="text-[11px]">{copy.askTurn.actions.copy}</span>
          </>
        )}
      </button>

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

