import { api } from "../../api/client";
import type { components } from "../../api/generated/schema";

export type CoverageResponse = components["schemas"]["CoverageResponse"];
export type CoverageCountry = components["schemas"]["CoverageCountry"];
export type CoverageSource = components["schemas"]["CoverageSource"];
export type CoverageStatus = CoverageCountry["status"];

/**
 * La ruta, exportada aparte para que routing.test.ts pueda afirmar que no
 * volvio a colarse el prefijo /v1 que ya rompio el front una vez.
 */
export const COVERAGE_PATH = "/coverage";

/**
 * GET /coverage: agregados exactos, calculados por el ETL y leidos con SQL
 * fijo. No pasa por el modelo ni consume cuota, asi que la portada puede
 * mostrarlos sin gastar nada.
 *
 * Los tipos salen del OpenAPI (`npm run api:types`) y no escritos a mano. La
 * version a mano ya se habia quedado sin country_name ni flag_asset despues
 * de que la API los agregara, y de eso nadie se entera hasta que algo sale
 * vacio en pantalla.
 */
export async function fetchCoverage(): Promise<CoverageResponse> {
  const { data, error } = await api.GET(COVERAGE_PATH, {});
  if (error) {
    throw new Error("No se pudo leer la cobertura");
  }
  return data;
}
