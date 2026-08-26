export type TableAlignment = "left" | "center" | "right";

export type ParsedTable = {
  headers: string[];
  rows: string[][];
  alignments: TableAlignment[];
};

/**
 * Divide una fila de tabla Markdown respetando barras escapadas (\|).
 */
export function splitTableRow(rowStr: string): string[] {
  let trimmed = rowStr.trim();
  if (trimmed.startsWith("|")) {
    trimmed = trimmed.slice(1);
  }
  if (trimmed.endsWith("|") && !trimmed.endsWith("\\|")) {
    trimmed = trimmed.slice(0, -1);
  }

  const cells: string[] = [];
  let current = "";
  let escaped = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Comprueba si una línea corresponde a un separador de tabla Markdown (ej. |---|:---:|---:|).
 */
export function isDelimiterRow(rowStr: string): boolean {
  const cells = splitTableRow(rowStr);
  if (cells.length === 0) return false;
  return cells.every((cell) => /^:?-+:?$/.test(cell.trim()));
}

/**
 * Obtiene las alineaciones de las columnas a partir de la fila delimitadora.
 */
export function parseAlignments(delimiterRowStr: string): TableAlignment[] {
  const cells = splitTableRow(delimiterRowStr);
  return cells.map((cell) => {
    const c = cell.trim();
    const starts = c.startsWith(":");
    const ends = c.endsWith(":");
    if (starts && ends) return "center";
    if (ends) return "right";
    return "left";
  });
}

/**
 * Parsea un bloque de texto que representa una tabla Markdown.
 */
export function parseMarkdownTable(rawText: string): ParsedTable | null {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return null;

  // Busca el índice de la fila delimitadora (generalmente índice 1)
  let delimiterIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (isDelimiterRow(lines[i]!)) {
      delimiterIndex = i;
      break;
    }
  }

  // Si no hay delimitador con guiones, no es una tabla Markdown estándar
  if (delimiterIndex !== 1) {
    // Si no tiene delimitador estándar, intentamos verificar si es formato TSV/tabulado
    const tabLines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (tabLines.length >= 2 && tabLines.every((l) => l.includes("\t"))) {
      const headers = tabLines[0]!.split("\t").map((h) => h.trim());
      const rows = tabLines.slice(1).map((l) => l.split("\t").map((c) => c.trim()));
      const alignments = headers.map(() => "left" as TableAlignment);
      return { headers, rows, alignments };
    }
    return null;
  }

  const headerLine = lines[0]!;
  const delimiterLine = lines[1]!;
  const bodyLines = lines.slice(2);

  const headers = splitTableRow(headerLine);
  const alignments = parseAlignments(delimiterLine);

  const rows = bodyLines
    .filter((line) => !isDelimiterRow(line))
    .map((line) => {
      const cells = splitTableRow(line);
      // Asegura que cada fila tenga la misma longitud que los encabezados
      while (cells.length < headers.length) {
        cells.push("");
      }
      return cells.slice(0, headers.length);
    });

  return {
    headers,
    rows,
    alignments,
  };
}

/**
 * Extrae todas las tablas Markdown válidas presentes en un texto largo.
 */
export function extractMarkdownTables(text: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  const lines = text.split("\n");
  let currentBlock: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    const isTableLine =
      trimmed.includes("|") ||
      (inTable && trimmed.length > 0 && isDelimiterRow(trimmed));

    if (isTableLine) {
      currentBlock.push(line);
      inTable = true;
    } else {
      if (currentBlock.length >= 2) {
        const parsed = parseMarkdownTable(currentBlock.join("\n"));
        if (parsed) {
          tables.push(parsed);
        }
      }
      currentBlock = [];
      inTable = false;
    }
  }

  if (currentBlock.length >= 2) {
    const parsed = parseMarkdownTable(currentBlock.join("\n"));
    if (parsed) {
      tables.push(parsed);
    }
  }

  return tables;
}

/**
 * Genera formato TSV (Tab-Separated Values) compatible nativamente con Excel,
 * Google Sheets, LibreOffice Calc y Word.
 */
export function tableToTsv(headers: string[], rows: string[][]): string {
  const clean = (val: string) => val.replace(/[\t\r\n]+/g, " ").trim();
  const headerLine = headers.map(clean).join("\t");
  const rowLines = rows.map((row) => row.map(clean).join("\t"));
  return [headerLine, ...rowLines].join("\r\n");
}

/**
 * Genera formato CSV escapando correctamente comas, comillas dobles y saltos de línea.
 */
export function tableToCsv(headers: string[], rows: string[][]): string {
  const escapeCsvCell = (val: string) => {
    const text = val.replace(/\r?\n/g, " ").trim();
    if (text.includes(",") || text.includes('"') || text.includes("\n") || text.includes(";")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const headerLine = headers.map(escapeCsvCell).join(",");
  const rowLines = rows.map((row) => row.map(escapeCsvCell).join(","));
  return [headerLine, ...rowLines].join("\r\n");
}

/**
 * Genera un fragmento HTML <table> estándar para el portapapeles enriquecido.
 */
export function tableToHtml(headers: string[], rows: string[][]): string {
  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const ths = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const trs = rows
    .map((row) => {
      const tds = row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

/**
 * Descarga el contenido CSV como un archivo en el dispositivo del usuario.
 * Añade prefijo UTF-8 BOM (\uFEFF) para visualización perfecta de tildes en Excel.
 */
export function downloadCsvFile(csvContent: string, customFilename?: string): void {
  const today = new Date().toISOString().slice(0, 10);
  const filename = customFilename || `tabla_${today}.csv`;

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copia la tabla al portapapeles en formato TSV y HTML enriquecido.
 */
export async function copyTableToClipboard(
  headers: string[],
  rows: string[][],
): Promise<boolean> {
  const tsv = tableToTsv(headers, rows);
  const html = tableToHtml(headers, rows);

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && "ClipboardItem" in window) {
      const textBlob = new Blob([tsv], { type: "text/plain" });
      const htmlBlob = new Blob([html], { type: "text/html" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": textBlob,
          "text/html": htmlBlob,
        }),
      ]);
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(tsv);
      return true;
    }
  } catch {
    try {
      await navigator.clipboard.writeText(tsv);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

