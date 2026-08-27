import { useQuery } from "@tanstack/react-query";
import { FormEvent, FocusEvent, useEffect, useId, useRef, useState } from "react";

import { ArrowLeftIcon, GlobeIcon, SearchIcon, ShieldIcon } from "../../components/icons";
import { copy } from "../../i18n/copy";
import { formatCount } from "../../lib/format";
import { fetchProcessStatuses } from "../procedures/api";
import { resolveEntities } from "./api";
import {
  buildManualSearchQuestion,
  EMPTY_MANUAL_SEARCH_FILTERS,
  hasMixedCurrencyAmountRisk,
  type ManualEntityType,
  type ManualSearchFilters,
  type ManualSearchStatus,
  validateManualSearchFilters,
  withEntityType,
} from "./manualSearch";

export type ManualCountryOption = {
  code: string;
  name: string;
  flagImage: string;
  active: boolean;
};

type Props = {
  countryOptions: ManualCountryOption[];
  countryCatalogLoading: boolean;
  countryCatalogUnavailable: boolean;
  isPending: boolean;
  onBack: () => void;
  onSearch: (question: string, countries: string[]) => void;
};

function initialFilters(): ManualSearchFilters {
  return { ...EMPTY_MANUAL_SEARCH_FILTERS, statuses: [] };
}

export function ManualSearchPanel({
  countryOptions,
  countryCatalogLoading,
  countryCatalogUnavailable,
  isPending,
  onBack,
  onSearch,
}: Props) {
  const availableCountries = countryOptions.filter(({ active }) => active);
  const [countries, setCountries] = useState<string[]>(() =>
    availableCountries.map(({ code }) => code),
  );
  const [filters, setFilters] = useState<ManualSearchFilters>(initialFilters);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [debouncedEntityName, setDebouncedEntityName] = useState("");
  const [entityFocused, setEntityFocused] = useState(false);
  const backRef = useRef<HTMLButtonElement>(null);
  const countriesInitialized = useRef(countries.length > 0);
  const id = useId();

  useEffect(() => {
    backRef.current?.focus();
  }, []);

  useEffect(() => {
    if (countriesInitialized.current || availableCountries.length === 0) return;
    setCountries(availableCountries.map(({ code }) => code));
    countriesInitialized.current = true;
  }, [availableCountries]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onBack();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onBack]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedEntityName(filters.entityName.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [filters.entityName]);

  const entitiesQuery = useQuery({
    queryKey: ["entity-resolve", filters.entityType, debouncedEntityName, countries],
    queryFn: () =>
      resolveEntities({
        q: debouncedEntityName,
        type: filters.entityType,
        countries,
      }),
    enabled: countries.length > 0 && debouncedEntityName.length >= 2,
    staleTime: 10 * 60 * 1000,
  });
  const statusesQuery = useQuery({
    queryKey: ["process-statuses"],
    queryFn: fetchProcessStatuses,
    staleTime: 10 * 60 * 1000,
  });

  const update = <Key extends keyof ManualSearchFilters>(
    key: Key,
    value: ManualSearchFilters[Key],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setValidationError(null);
  };

  const toggleStatus = (status: ManualSearchStatus) => {
    update(
      "statuses",
      filters.statuses.includes(status)
        ? filters.statuses.filter((selected) => selected !== status)
        : [...filters.statuses, status],
    );
  };

  const toggleCountry = (country: string) => {
    setCountries((current) =>
      current.includes(country)
        ? current.filter((selected) => selected !== country)
        : [...current, country],
    );
    setValidationError(null);
  };

  const changeEntityType = (entityType: ManualEntityType) => {
    setFilters((current) => withEntityType(current, entityType));
    setValidationError(null);
  };

  const closeSuggestionsOnOutsideFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setEntityFocused(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const error = validateManualSearchFilters(filters, countries);
    if (error) {
      setValidationError(error);
      return;
    }
    onSearch(buildManualSearchQuestion(filters, countries), countries);
  };

  const showCurrencyWarning = hasMixedCurrencyAmountRisk(filters, countries);
  const allCountriesSelected =
    availableCountries.length > 0 &&
    availableCountries.every(({ code }) => countries.includes(code));
  const candidates = entitiesQuery.data ?? [];
  const showSuggestions = entityFocused && countries.length > 0 && debouncedEntityName.length >= 2;

  return (
    <div className="manual-search-panel">
      <div className="manual-search-heading">
        <button
          ref={backRef}
          type="button"
          className="manual-search-back"
          onClick={onBack}
          aria-label={copy.manualSearch.back}
        >
          <ArrowLeftIcon size={18} />
          <span>{copy.manualSearch.back}</span>
        </button>
        <div>
          <h2>{copy.manualSearch.title}</h2>
          <p>{copy.manualSearch.description}</p>
        </div>
      </div>

      <form className="manual-search-form" onSubmit={submit}>
        <fieldset className="manual-fieldset manual-country-fieldset">
          <legend>{copy.manualSearch.countryGroup}</legend>
          {countryCatalogLoading ? (
            <p className="manual-field-message">{copy.manualSearch.countryLoading}</p>
          ) : countryCatalogUnavailable ? (
            <p className="manual-field-message" role="alert">
              {copy.manualSearch.countryUnavailable}
            </p>
          ) : (
            <div className="manual-country-options">
              <button
                type="button"
                className={`manual-country-chip all ${allCountriesSelected ? "selected" : ""}`}
                aria-pressed={allCountriesSelected}
                onClick={() => {
                  setCountries(
                    allCountriesSelected ? [] : availableCountries.map(({ code }) => code),
                  );
                  setValidationError(null);
                }}
              >
                <GlobeIcon size={22} />
                <span>{copy.countries.all}</span>
              </button>
              {availableCountries.map(({ code, name, flagImage }) => {
                const selected = countries.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    className={`manual-country-chip ${selected ? "selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => toggleCountry(code)}
                  >
                    <img src={flagImage} alt="" aria-hidden="true" />
                    <span>{name}</span>
                    <span className="manual-checkbox" aria-hidden="true">
                      {selected ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>

        <fieldset className="manual-fieldset manual-date-fieldset">
          <legend>{copy.manualSearch.dateGroup}</legend>
          <div className="manual-two-columns">
            <label htmlFor={`${id}-date-from`}>
              <span>{copy.manualSearch.dateFrom}</span>
              <input
                id={`${id}-date-from`}
                type="date"
                value={filters.dateFrom}
                max={filters.dateTo || undefined}
                onChange={(event) => update("dateFrom", event.target.value)}
              />
            </label>
            <label htmlFor={`${id}-date-to`}>
              <span>{copy.manualSearch.dateTo}</span>
              <input
                id={`${id}-date-to`}
                type="date"
                value={filters.dateTo}
                min={filters.dateFrom || undefined}
                onChange={(event) => update("dateTo", event.target.value)}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="manual-fieldset manual-status-fieldset">
          <legend>{copy.manualSearch.statusGroup}</legend>
          <div className="manual-status-options">
            {statusesQuery.isLoading ? (
              <p>{copy.manualSearch.statusLoading}</p>
            ) : statusesQuery.isError ? (
              <p role="alert">{copy.manualSearch.statusUnavailable}</p>
            ) : (statusesQuery.data?.statuses ?? []).length === 0 ? (
              <p>{copy.manualSearch.statusEmpty}</p>
            ) : (
              (statusesQuery.data?.statuses ?? []).map(({ value, process_count }) => {
                const selected = filters.statuses.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    className={`manual-status-chip ${selected ? "selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => toggleStatus(value)}
                  >
                    <span className="manual-checkbox" aria-hidden="true">
                      {selected ? "✓" : ""}
                    </span>
                    {value}
                    <small className="tabular">{formatCount(process_count)}</small>
                  </button>
                );
              })
            )}
          </div>
        </fieldset>

        <div className="manual-form-grid">
          <label className="manual-field" htmlFor={`${id}-method`}>
            <span>{copy.manualSearch.method}</span>
            <input
              id={`${id}-method`}
              value={filters.procurementMethod}
              maxLength={80}
              onChange={(event) => update("procurementMethod", event.target.value)}
              placeholder={copy.manualSearch.methodPlaceholder}
            />
          </label>

          <fieldset className="manual-fieldset manual-entity-fieldset">
            <legend>{copy.manualSearch.entityGroup}</legend>
            <span className="manual-entity-type-label">{copy.manualSearch.entityType}</span>
            <div className="manual-entity-types">
              {(["buyer", "supplier"] as const).map((entityType) => (
                <button
                  key={entityType}
                  type="button"
                  aria-pressed={filters.entityType === entityType}
                  className={filters.entityType === entityType ? "selected" : ""}
                  onClick={() => changeEntityType(entityType)}
                >
                  {copy.manualSearch.entityTypes[entityType]}
                </button>
              ))}
            </div>

            <div className="entity-autocomplete" onBlur={closeSuggestionsOnOutsideFocus}>
              <label htmlFor={`${id}-entity-name`}>{copy.manualSearch.entityName}</label>
              <div className="entity-input-wrap">
                <SearchIcon size={18} />
                <input
                  id={`${id}-entity-name`}
                  value={filters.entityName}
                  maxLength={100}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={showSuggestions}
                  aria-controls={`${id}-entity-options`}
                  placeholder={copy.manualSearch.entityPlaceholder}
                  onFocus={() => setEntityFocused(true)}
                  onChange={(event) => update("entityName", event.target.value)}
                />
              </div>

              {showSuggestions && (
                <div id={`${id}-entity-options`} className="entity-options" role="listbox">
                  {entitiesQuery.isFetching ? (
                    <p>{copy.manualSearch.entitySearching}</p>
                  ) : entitiesQuery.isError ? (
                    <p>{copy.manualSearch.entityUnavailable}</p>
                  ) : candidates.length === 0 ? (
                    <p>{copy.manualSearch.entityNoMatches}</p>
                  ) : (
                    candidates.map((candidate) => (
                      <button
                        key={`${candidate.entity_type}-${candidate.entity_id}`}
                        type="button"
                        role="option"
                        aria-selected={filters.entityName === candidate.display_name}
                        onClick={() => {
                          update("entityName", candidate.display_name);
                          setDebouncedEntityName(candidate.display_name);
                          setEntityFocused(false);
                        }}
                      >
                        <span>{candidate.display_name}</span>
                        <small>
                          {candidate.country_code} · {candidate.tax_id ?? "—"} ·{" "}
                          {copy.manualSearch.entityRecords.replace(
                            "{n}",
                            formatCount(candidate.record_count),
                          )}
                        </small>
                      </button>
                    ))
                  )}
                </div>
              )}
              <small className="manual-field-hint">
                {countries.length === 0
                  ? copy.manualSearch.entityNeedsCountry
                  : copy.manualSearch.entityHint}
              </small>
            </div>
          </fieldset>

          <fieldset className="manual-fieldset manual-amount-fieldset">
            <legend>{copy.manualSearch.amountGroup}</legend>
            <div className="manual-two-columns">
              <label htmlFor={`${id}-amount-min`}>
                <span>{copy.manualSearch.amountMin}</span>
                <input
                  id={`${id}-amount-min`}
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={filters.amountMin}
                  placeholder={copy.manualSearch.amountPlaceholder}
                  onChange={(event) => update("amountMin", event.target.value)}
                />
              </label>
              <label htmlFor={`${id}-amount-max`}>
                <span>{copy.manualSearch.amountMax}</span>
                <input
                  id={`${id}-amount-max`}
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={filters.amountMax}
                  placeholder={copy.manualSearch.amountPlaceholder}
                  onChange={(event) => update("amountMax", event.target.value)}
                />
              </label>
            </div>
            {showCurrencyWarning && (
              <p className="manual-currency-warning" role="note">
                <ShieldIcon size={18} />
                {copy.manualSearch.mixedCurrencyWarning}
              </p>
            )}
          </fieldset>
        </div>

        {validationError && (
          <p className="manual-validation-error" role="alert">
            {validationError}
          </p>
        )}

        <div className="manual-submit-row">
          <button type="submit" disabled={isPending}>
            <SearchIcon size={19} />
            {copy.manualSearch.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
