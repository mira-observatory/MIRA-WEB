import { SparkIcon } from "../../../components/icons";

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
  if (isTemplateOnly) {
    return (
      <div className="rounded-2xl border border-rule bg-paper px-5 py-4">
        <p className="font-sans text-sm leading-relaxed text-ink-soft">{text}</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-isthmus/15 bg-white px-6 py-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wide text-isthmus">
        <SparkIcon size={15} />
        Generado por IA
        {verified && (
          <span className="rounded-full bg-quetzal/10 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-quetzal">
            Verificado contra los datos de la tabla
          </span>
        )}
      </div>
      <p className="font-display text-[17px] leading-relaxed text-ink">{text}</p>
    </div>
  );
}
