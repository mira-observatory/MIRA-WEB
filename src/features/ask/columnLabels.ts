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
const COLUMN_LABEL: Record<string, string> = {
  // Identificadores
  process_id: "Proceso",
  award_id: "Adjudicación",
  item_id: "Artículo",
  buyer_id: "Comprador",
  supplier_id: "Proveedor",
  source_award_id: "ID de adjudicación (fuente)",
  source_item_id: "ID del artículo (fuente)",
  buyer_tax_id: "Cédula del comprador",
  supplier_tax_id: "Cédula del proveedor",
  name_normalised: "Nombre",
  supplier_type: "Tipo de proveedor",

  // Ubicacion y moneda
  country_code: "País",
  currency_code: "Moneda",
  source_system: "Fuente",

  // Montos y fechas
  awarded_amount: "Monto adjudicado",
  estimated_amount: "Monto estimado",
  award_date: "Fecha de adjudicación",
  closing_date: "Fecha de cierre",
  publication_date: "Fecha de publicación",
  extracted_at: "Fecha de extracción",
  normalised_at: "Fecha de normalización",
  loaded_at: "Fecha de carga",
  source_last_modified_at: "Última modificación (fuente)",

  // Descripcion del proceso
  title: "Título",
  description: "Descripción",
  process_number: "Número de expediente",
  process_status: "Estado",
  procurement_method: "Modalidad de contratación",
  source_status: "Estado (fuente original)",
  source_url: "Enlace de la fuente",
  data_quality_status: "Calidad del dato",
  missing_fields: "Campos faltantes",

  // Articulos
  item_description: "Descripción del artículo",
  category_normalised: "Categoría",
  category_source: "Categoría (fuente original)",
  line_number: "Número de línea",

  // Cobertura del ETL
  period: "Periodo",
  row_count: "Filas",
  status: "Estado",
  table_name: "Tabla",

  // Alias de agregacion comunes en el SQL generado
  count: "Cantidad",
  total: "Total",
  total_amount: "Monto total",
  total_count: "Cantidad total",
};

/** "algun_alias_nuevo" -> "Algun alias nuevo" -- nunca un snake_case desnudo. */
function humanize(name: string): string {
  const words = name.replace(/_/g, " ").trim();
  if (!words) return name;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function columnLabel(name: string): string {
  return COLUMN_LABEL[name] ?? humanize(name);
}
