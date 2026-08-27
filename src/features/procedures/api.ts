import { api } from "../../api/client";
import type { components, operations } from "../../api/generated/schema";

export type Procedure = components["schemas"]["Procedure"];
export type ProceduresResponse = components["schemas"]["ProceduresResponse"];
export type ProcedureStatus = NonNullable<Procedure["process_status"]>;
export type ProcedureQuery = NonNullable<
  operations["get_procedures_procedures_get"]["parameters"]["query"]
>;

export const PROCEDURES_PATH = "/procedures";

export async function fetchProcedures(query: ProcedureQuery): Promise<ProceduresResponse> {
  const { data, error } = await api.GET(PROCEDURES_PATH, { params: { query } });
  if (error) throw new Error("No se pudieron leer los procedimientos");
  return data;
}
