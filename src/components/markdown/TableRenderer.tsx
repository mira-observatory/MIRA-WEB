import { TableAlignment } from "./tableUtils";

type Props = {
  headers: string[];
  rows: string[][];
  alignments?: TableAlignment[];
  className?: string;
};

const ALIGNMENT_CLASSES: Record<TableAlignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/**
 * Renderiza una celda interpretando formato simple inline de forma segura (sin innerHTML):
 * negrita, cursiva, codigo inline, enlaces.
 */
export function RenderCellContent({ text }: { text: string }) {
  if (!text) return <span>—</span>;

  // Regex para detectar enlaces [texto](url), negrita **texto**, cursiva *texto*, codigo `code`
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let key = 0;

  // Parseo lineal seguro
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = regex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={key++} className="font-semibold text-ink">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={key++} className="italic">{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-paper-sunken px-1.5 py-0.5 font-mono text-[12px] text-ink"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[") && token.includes("](")) {
      const closingBracket = token.indexOf("](");
      const linkText = token.slice(1, closingBracket);
      const linkUrl = token.slice(closingBracket + 2, -1);
      // Validar protocolos seguros
      const isSafeUrl = /^https?:\/\//i.test(linkUrl) || linkUrl.startsWith("/");
      if (isSafeUrl) {
        parts.push(
          <a
            key={key++}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-isthmus hover:underline underline-offset-2"
          >
            {linkText}
          </a>
        );
      } else {
        parts.push(linkText);
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex));
  }

  return <>{parts.length > 0 ? parts : text}</>;
}

/**
 * Componente visual para renderizar tablas Markdown con la estética limpia y moderna de ChatGPT.
 */
export function TableRenderer({
  headers,
  rows,
  alignments = [],
  className = "",
}: Props) {
  const getAlignClass = (index: number) => {
    const align = alignments[index] || "left";
    return ALIGNMENT_CLASSES[align] || "text-left";
  };

  return (
    <div
      className={`my-3 overflow-hidden rounded-xl border border-rule/80 bg-paper-raised shadow-sm transition ${className}`}
    >
      {/* Contenedor con scroll horizontal para tablas anchas */}
      <div className="overflow-x-auto max-w-full">
        <table className="w-full min-w-max border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-rule bg-paper-sunken/60 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-4 py-2.5 whitespace-nowrap ${getAlignClass(idx)}`}
                >
                  <RenderCellContent text={header} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/50">
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="transition-colors hover:bg-paper-sunken/30 even:bg-paper/30"
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={`px-4 py-2 text-ink ${getAlignClass(cellIdx)}`}
                  >
                    <RenderCellContent text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
