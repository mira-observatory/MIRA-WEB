import { api } from "../../api/client";
import type { components } from "../../api/generated/schema";

export type CoverageResponse = components["schemas"]["CoverageResponse"];
export type CoverageCountry = components["schemas"]["CoverageCountry"];

/**
 * GET /coverage: agregados exactos, calculados por el ETL y leidos con SQL
 * fijo. No pasa por el modelo ni consume cuota, asi que la portada puede
 * mostrarlos sin gastar nada.
 */
export async function fetchCoverage(): Promise<CoverageResponse> {
  const { data, error } = await api.GET("/coverage", {});
  if (error) {
    throw new Error("No se pudo leer la cobertura");
  }
  return data;
}
