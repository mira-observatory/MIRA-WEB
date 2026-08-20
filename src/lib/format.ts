/**
 * Formato de datos que vienen de la base.
 *
 * La regla dura del proyecto: nunca se suman ni se comparan montos de monedas
 * distintas. Guatemala publica en GTQ, Honduras en HNL, Nicaragua en NIO y Costa
 * Rica en CRC; no existe una tasa de cambio confiable en el modelo de datos, asi
 * que agregar entre paises produciria una cifra falsa.
 */

import { copy } from "../i18n/copy";

const LOCALE_BY_COUNTRY: Record<string, string> = {
  GT: "es-GT",
  HN: "es-HN",
  NI: "es-NI",
  CR: "es-CR",
  SV: "es-SV",
  PA: "es-PA",
};

/**
 * Formatea un monto. Exige el codigo de moneda a proposito: sin el no se puede
 * saber que representa el numero, y mostrarlo como dinero seria mentir.
 */
export function formatMoney(
  value: number | null | undefined,
  currencyCode: string | null | undefined,
  countryCode?: string,
): string {
  if (value === null || value === undefined) return copy.format.missingData;
  if (!currencyCode) {
    // Hay registros sin moneda declarada. Se muestran como numero desnudo y se
    // reportan aparte, nunca se descartan en silencio ni se asumen en una moneda.
    return `${new Intl.NumberFormat("es").format(value)} (${copy.format.missingCurrency})`;
  }
  const locale = (countryCode && LOCALE_BY_COUNTRY[countryCode]) || "es";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return copy.format.missingData;
  return new Intl.NumberFormat("es").format(value);
}

export function formatDate(value: string | null | undefined, countryCode?: string): string {
  if (!value) return copy.format.missingDate;
  const locale = (countryCode && LOCALE_BY_COUNTRY[countryCode]) || "es";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

/**
 * Indica si un conjunto de columnas de dinero puede graficarse en un mismo eje.
 * Si hay mas de una moneda, la respuesta es no: se rompe en paneles por moneda.
 */
export function canShareMoneyAxis(currencyCodes: (string | null | undefined)[]): boolean {
  const distinct = new Set(currencyCodes.filter(Boolean));
  return distinct.size <= 1;
}
