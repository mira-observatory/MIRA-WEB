import { getCopy } from "../../i18n";

/**
 * Traduce los nombres de columna que vienen de query.* (MIRA-ETL) a algo que
 * una persona sin conocimiento tecnico pueda leer -- "process_id" no le dice
 * nada a nadie, "Proceso" si. Cubre las columnas reales de las 8 vistas
 * (query.semantic_dictionary, verificado en produccion 2026-08-19) mas los
 * alias de agregacion mas comunes que genera el modelo (count, total).
 *
 * Cualquier columna que no este aqui (un alias nuevo del modelo, por
 * ejemplo) cae al humanizador generico: nunca se muestra un snake_case
 * desnudo.
 */
const COLUMN_LABEL: Record<string, string> = { ...getCopy().columns };

/** "algun_alias_nuevo" -> "Algun alias nuevo" -- nunca un snake_case desnudo. */
function humanize(name: string): string {
  const words = name.replace(/_/g, " ").trim();
  if (!words) return name;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function columnLabel(name: string): string {
  return COLUMN_LABEL[name] ?? humanize(name);
}
