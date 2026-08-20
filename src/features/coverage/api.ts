import { copy } from "../../i18n/copy";

export type CoverageStatus = "ACTIVE" | "PLANNED" | "INACTIVE";

export type CoverageSource = {
  source_key: string;
  source_system: string;
  display_name: string;
  status: CoverageStatus;
  process_count: number;
  buyer_count: number;
  supplier_count: number;
  coverage_from: string | null;
  coverage_to: string | null;
  complete_process_count: number;
  partial_process_count: number;
  process_without_date_count: number;
  last_successful_load_at: string | null;
  refreshed_at: string | null;
};

export type CoverageCountry = {
  country_code: string;
  status: CoverageStatus;
  active_sources: number;
  process_count: number;
  buyer_count: number;
  supplier_count: number;
  coverage_from: string | null;
  coverage_to: string | null;
  last_successful_load_at: string | null;
  sources: CoverageSource[];
};

export type CoverageSummary = {
  active_countries: number;
  planned_countries: number;
  active_sources: number;
  process_count: number;
  coverage_from: string | null;
  coverage_to: string | null;
  last_successful_load_at: string | null;
};

export type CoverageResponse = {
  summary: CoverageSummary;
  countries: CoverageCountry[];
};

export const COVERAGE_PATH = "/coverage";

export async function fetchCoverage(): Promise<CoverageResponse> {
  const response = await fetch(`${import.meta.env.VITE_MIRA_API_BASE_URL}${COVERAGE_PATH}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`${copy.errors.serviceResponded} ${response.status}`);
  }
  return response.json() as Promise<CoverageResponse>;
}
