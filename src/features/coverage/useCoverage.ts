import { useQuery } from "@tanstack/react-query";

import { fetchCoverage, type CoverageCountry } from "./api";

/**
 * La cobertura solo cambia cuando corre el ETL, asi que no tiene sentido
 * refrescarla seguido. Es la misma razon por la que el QueryClient de la app
 * usa un staleTime largo.
 */
export function useCoverage() {
  return useQuery({
    queryKey: ["coverage"],
    queryFn: fetchCoverage,
    staleTime: 10 * 60 * 1000,
  });
}

/** Indexa los paises de la respuesta por su codigo ISO en minuscula, que es
 * como los identifica el selector de la portada. */
export function byCountryId(
  countries: CoverageCountry[] | undefined,
): Record<string, CoverageCountry> {
  const index: Record<string, CoverageCountry> = {};
  for (const country of countries ?? []) {
    index[country.country_code.toLowerCase()] = country;
  }
  return index;
}

/** "2025-02-05" + "2026-08-20" -> "feb 2025 – ago 2026". Sin dia: la
 * cobertura es un rango grueso, y el dia exacto sugiere una precision que el
 * dato no tiene. */
export function formatCoverageRange(from: string | null, to: string | null): string | null {
  if (!from || !to) return null;
  const mes = (iso: string) =>
    new Intl.DateTimeFormat("es", { month: "short", year: "numeric", timeZone: "UTC" }).format(
      new Date(`${iso}T00:00:00Z`),
    );
  return `${mes(from)} – ${mes(to)}`;
}
