import { SparkIcon } from "../../../components/icons";
import { MarkdownRenderer } from "../../../components/markdown/MarkdownRenderer";
import { useCopy } from "../../../i18n";

type Props = {
  text: string;
  verified: boolean;
  /** true para OK_ZERO_ROWS / OK_DEGRADED_NARRATIVE: el texto es la plantilla
   * deterministica de respaldo, no prosa generada -- no debe vestirse como si
   * lo fuera. */
  isTemplateOnly: boolean;
};

/**
 * "Los numeros dentro del parrafo generado no se destacan: destacarlos les
 * daria una autoridad que no tienen." -- el texto se renderiza plano, sin
 * ningun resaltado de digitos.
 */
export function NarrativeBlock({ text, verified, isTemplateOnly }: Props) {
  const copy = useCopy();
  if (isTemplateOnly) {
    return (
      <div className="rounded-2xl border border-rule bg-paper px-5 py-4">
        <MarkdownRenderer content={text} className="font-sans text-sm text-ink-soft" />
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-isthmus/15 bg-white px-6 py-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wide text-isthmus">
        <SparkIcon size={15} />
        {copy.askTurn.generatedByAi}
        {verified && (
          <span className="rounded-full bg-quetzal/10 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-quetzal">
            {copy.askTurn.verifiedAgainstTable}
          </span>
        )}
      </div>
      <MarkdownRenderer content={text} />
    </div>
  );
}

