import { TableRenderer, RenderCellContent } from "./TableRenderer";
import { parseMarkdownTable } from "./tableUtils";

type Props = {
  content: string;
  className?: string;
};

type MarkdownBlock =
  | { type: "table"; raw: string }
  | { type: "code"; language: string; code: string }
  | { type: "heading"; level: number; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "paragraph"; text: string };

/**
 * Parsea el texto Markdown completo en bloques estructurados.
 */
export function parseBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // 1. Líneas vacías
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Bloques de código (```lang ... ```)
    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trim().startsWith("```")) {
        codeLines.push(lines[i]!);
        i++;
      }
      if (i < lines.length) i++; // Salta el cierre de ```
      blocks.push({
        type: "code",
        language,
        code: codeLines.join("\n"),
      });
      continue;
    }

    // 3. Tablas Markdown (| Col1 | Col2 | ...)
    if (trimmed.includes("|")) {
      const tableLines: string[] = [line];
      let j = i + 1;
      while (j < lines.length && (lines[j]!.trim().includes("|") || lines[j]!.trim().length === 0)) {
        if (lines[j]!.trim().length > 0) {
          tableLines.push(lines[j]!);
        } else {
          break;
        }
        j++;
      }

      const tableRaw = tableLines.join("\n");
      const parsed = parseMarkdownTable(tableRaw);
      if (parsed && parsed.headers.length > 0 && parsed.rows.length > 0) {
        blocks.push({ type: "table", raw: tableRaw });
        i = j;
        continue;
      }
    }

    // 4. Encabezados (#, ##, ###)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch && headingMatch[1] && headingMatch[2]) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // 5. Citas (> quote)
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [trimmed.replace(/^>\s?/, "")];
      let j = i + 1;
      while (j < lines.length && lines[j]!.trim().startsWith(">")) {
        quoteLines.push(lines[j]!.trim().replace(/^>\s?/, ""));
        j++;
      }
      blocks.push({
        type: "blockquote",
        text: quoteLines.join(" "),
      });
      i = j;
      continue;
    }

    // 6. Listas ordenadas o no ordenadas
    const isUnordered = /^[-*•]\s+/.test(trimmed);
    const isOrdered = /^\d+\.\s+/.test(trimmed);

    if (isUnordered || isOrdered) {
      const items: string[] = [];
      const isCurrOrdered = isOrdered;
      let j = i;

      while (j < lines.length) {
        const currLine = lines[j]!.trim();
        if (!currLine) break;

        const match = isCurrOrdered
          ? currLine.match(/^\d+\.\s+(.+)$/)
          : currLine.match(/^[-*•]\s+(.+)$/);

        if (match && match[1]) {
          items.push(match[1].trim());
          j++;
        } else {
          break;
        }
      }

      if (items.length > 0) {
        blocks.push({
          type: "list",
          ordered: isCurrOrdered,
          items,
        });
        i = j;
        continue;
      }
    }

    // 7. Párrafo estándar (acumula líneas consecutivas de texto)
    const paraLines: string[] = [line];
    let j = i + 1;
    while (j < lines.length) {
      const nextTrimmed = lines[j]!.trim();
      if (
        !nextTrimmed ||
        nextTrimmed.startsWith("```") ||
        nextTrimmed.startsWith("#") ||
        nextTrimmed.startsWith(">") ||
        /^[-*•]\s+/.test(nextTrimmed) ||
        /^\d+\.\s+/.test(nextTrimmed) ||
        nextTrimmed.includes("|")
      ) {
        break;
      }
      paraLines.push(lines[j]!);
      j++;
    }

    blocks.push({
      type: "paragraph",
      text: paraLines.join(" "),
    });
    i = j;
  }

  return blocks;
}

/**
 * Renderizador de Markdown seguro y nativo para las respuestas de la IA.
 */
export function MarkdownRenderer({ content, className = "" }: Props) {
  if (!content) return null;

  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-3.5 leading-relaxed text-ink ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "table": {
            const table = parseMarkdownTable(block.raw);
            if (!table) {
              return <p key={idx} className="font-sans text-sm">{block.raw}</p>;
            }
            return (
              <TableRenderer
                key={idx}
                headers={table.headers}
                rows={table.rows}
                alignments={table.alignments}
              />
            );
          }

          case "code":
            return (
              <div
                key={idx}
                className="my-3 overflow-hidden rounded-xl border border-rule bg-paper-sunken font-mono text-xs shadow-sm"
              >
                {block.language && (
                  <div className="border-b border-rule/60 bg-paper-sunken/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                    {block.language}
                  </div>
                )}
                <pre className="overflow-x-auto p-3.5 text-ink leading-relaxed">
                  <code>{block.code}</code>
                </pre>
              </div>
            );

          case "heading": {
            const headingClasses: Record<number, string> = {
              1: "font-display text-xl font-bold text-ink mt-4 mb-2",
              2: "font-display text-lg font-bold text-ink mt-3.5 mb-1.5",
              3: "font-display text-base font-semibold text-ink mt-3 mb-1",
              4: "font-sans text-sm font-semibold text-ink mt-2 mb-1",
              5: "font-sans text-xs font-semibold uppercase tracking-wide text-ink-soft mt-2",
              6: "font-sans text-xs font-semibold uppercase tracking-wide text-ink-faint mt-2",
            };
            const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
            return (
              <HeadingTag key={idx} className={headingClasses[block.level] || headingClasses[3]}>
                <RenderCellContent text={block.text} />
              </HeadingTag>
            );
          }

          case "blockquote":
            return (
              <blockquote
                key={idx}
                className="my-2 border-l-4 border-isthmus/40 bg-paper-sunken/30 px-4 py-2 font-display text-[15px] italic text-ink-soft rounded-r-lg"
              >
                <RenderCellContent text={block.text} />
              </blockquote>
            );

          case "list": {
            const ListTag = block.ordered ? "ol" : "ul";
            const listClass = block.ordered
              ? "list-decimal list-inside space-y-1.5 font-sans text-[15px] pl-1 text-ink"
              : "list-disc list-inside space-y-1.5 font-sans text-[15px] pl-1 text-ink";

            return (
              <ListTag key={idx} className={listClass}>
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed">
                    <RenderCellContent text={item} />
                  </li>
                ))}
              </ListTag>
            );
          }

          case "paragraph":
            return (
              <p key={idx} className="font-display text-[16px] leading-relaxed text-ink">
                <RenderCellContent text={block.text} />
              </p>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
