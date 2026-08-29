/**
 * Formato de datos que vienen de la base.
 *
 * La regla dura del proyecto: nunca se suman ni se comparan montos de monedas
 * distintas. Guatemala publica en GTQ, Honduras en HNL, Nicaragua en NIO y Costa
 * Rica en CRC; no existe una tasa de cambio confiable en el modelo de datos, asi
 * que agregar entre paises produciria una cifra falsa.
 */

import { getCopy, getLanguage, INTL_LOCALE } from "../i18n";

/**
 * Locale para escribir la cifra. En espanol se usa el del pais del dato, que es
 * como se publican ahi; en ingles se unifica en en-US. La moneda no entra en
 * esta decision: sale del propio registro y no cambia nunca con el idioma.
 */
function localeFor(countryCode?: string): string {
  if (getLanguage() !== "es") return INTL_LOCALE[getLanguage()];
  return (countryCode && LOCALE_BY_COUNTRY[countryCode]) || "es";
}

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
  if (value === null || value === undefined) return getCopy().format.missingData;
  if (!currencyCode) {
    // Hay registros sin moneda declarada. Se muestran como numero desnudo y se
    // reportan aparte, nunca se descartan en silencio ni se asumen en una moneda.
    return `${new Intl.NumberFormat(localeFor(countryCode)).format(value)} (${getCopy().format.missingCurrency})`;
  }
  return new Intl.NumberFormat(localeFor(countryCode), {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return getCopy().format.missingData;
  return new Intl.NumberFormat(localeFor()).format(value);
}

export function formatDate(value: string | null | undefined, countryCode?: string): string {
  if (!value) return getCopy().format.missingDate;
  return new Intl.DateTimeFormat(localeFor(countryCode), { dateStyle: "medium" }).format(
    new Date(value),
  );
}

/**
 * Indica si un conjunto de columnas de dinero puede graficarse en un mismo eje.
 * Si hay mas de una moneda, la respuesta es no: se rompe en paneles por moneda.
 */
export function canShareMoneyAxis(currencyCodes: (string | null | undefined)[]): boolean {
  const distinct = new Set(currencyCodes.filter(Boolean));
  return distinct.size <= 1;
}
