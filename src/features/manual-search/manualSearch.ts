import { countryName, getCopy } from "../../i18n";

export type ManualSearchStatus = string;
export type ManualEntityType = "buyer" | "supplier";

export type ManualSearchFilters = {
  dateFrom: string;
  dateTo: string;
  statuses: ManualSearchStatus[];
  procurementMethod: string;
  entityType: ManualEntityType;
  entityName: string;
  amountMin: string;
  amountMax: string;
};

export const EMPTY_MANUAL_SEARCH_FILTERS: ManualSearchFilters = {
  dateFrom: "",
  dateTo: "",
  statuses: [],
  procurementMethod: "",
  entityType: "buyer",
  entityName: "",
  amountMin: "",
  amountMax: "",
};

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}

function naturalList(values: string[]): string {
  if (values.length < 2) return values[0] ?? "";
  return `${values.slice(0, -1).join(", ")}${getCopy().manualSearch.question.listJoiner}${values.at(-1)}`;
}

function compactUserText(value: string, maxLength: number): string {
  return value.trim().replaceAll(/\s+/g, " ").replaceAll('"', "'").slice(0, maxLength);
}

function orderedStatuses(statuses: ManualSearchStatus[]): ManualSearchStatus[] {
  return [...new Set(statuses)].sort();
}

export function buildManualSearchQuestion(
  filters: ManualSearchFilters,
  countryCodes: string[],
): string {
  const countries = naturalList(countryCodes.map((code) => countryName(code)));
  const clauses = [fill(getCopy().manualSearch.question.base, { countries })];

  if (filters.dateFrom && filters.dateTo) {
    clauses.push(
      fill(getCopy().manualSearch.question.dateRange, {
        from: filters.dateFrom,
        to: filters.dateTo,
      }),
    );
  } else if (filters.dateFrom) {
    clauses.push(fill(getCopy().manualSearch.question.dateFrom, { from: filters.dateFrom }));
  } else if (filters.dateTo) {
    clauses.push(fill(getCopy().manualSearch.question.dateTo, { to: filters.dateTo }));
  }

  const statuses = orderedStatuses(filters.statuses);
  if (statuses.length > 0) {
    clauses.push(
      fill(getCopy().manualSearch.question.statuses, {
        statuses: naturalList([...statuses]),
      }),
    );
  }

  const method = compactUserText(filters.procurementMethod, 80);
  if (method) clauses.push(fill(getCopy().manualSearch.question.method, { method }));

  const entityName = compactUserText(filters.entityName, 100);
  if (entityName) {
    clauses.push(
      fill(
        filters.entityType === "buyer"
          ? getCopy().manualSearch.question.buyer
          : getCopy().manualSearch.question.supplier,
        { name: entityName },
      ),
    );
  }

  if (filters.amountMin && filters.amountMax) {
    clauses.push(
      fill(getCopy().manualSearch.question.amountRange, {
        min: filters.amountMin,
        max: filters.amountMax,
      }),
    );
  } else if (filters.amountMin) {
    clauses.push(fill(getCopy().manualSearch.question.amountMin, { min: filters.amountMin }));
  } else if (filters.amountMax) {
    clauses.push(fill(getCopy().manualSearch.question.amountMax, { max: filters.amountMax }));
  }

  if (filters.amountMin || filters.amountMax) {
    clauses.push(getCopy().manualSearch.question.localCurrency);
  }

  return `${clauses.join(getCopy().manualSearch.question.separator)}${getCopy().manualSearch.question.ending}`;
}

export function validateManualSearchFilters(
  filters: ManualSearchFilters,
  countryCodes: string[],
): string | null {
  if (countryCodes.length === 0) return getCopy().manualSearch.errors.missingCountry;
  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    return getCopy().manualSearch.errors.invalidDateRange;
  }
  if (
    filters.amountMin &&
    filters.amountMax &&
    Number(filters.amountMin) > Number(filters.amountMax)
  ) {
    return getCopy().manualSearch.errors.invalidAmountRange;
  }
  return null;
}

export function hasMixedCurrencyAmountRisk(
  filters: ManualSearchFilters,
  countryCodes: string[],
): boolean {
  return countryCodes.length > 1 && Boolean(filters.amountMin || filters.amountMax);
}

export function withEntityType(
  filters: ManualSearchFilters,
  entityType: ManualEntityType,
): ManualSearchFilters {
  return { ...filters, entityType };
}
