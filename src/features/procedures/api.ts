import { api } from "../../api/client";
import type { components, operations } from "../../api/generated/schema";

export type Procedure = components["schemas"]["Procedure"];
export type ProceduresResponse = components["schemas"]["ProceduresResponse"];
export type ProcessStatusesResponse = components["schemas"]["ProcessStatusesResponse"];
export type ProcedureQuery = NonNullable<
  operations["get_procedures_procedures_get"]["parameters"]["query"]
>;

export const PROCEDURES_PATH = "/procedures";
export const PROCESS_STATUSES_PATH = "/procedures/statuses";

export async function fetchProcedures(query: ProcedureQuery): Promise<ProceduresResponse> {
  const { data, error } = await api.GET(PROCEDURES_PATH, { params: { query } });
  if (error) throw new Error("No se pudieron leer los procedimientos");
  return data;
}

export async function fetchProcessStatuses(): Promise<ProcessStatusesResponse> {
  const { data, error } = await api.GET(PROCESS_STATUSES_PATH, {});
  if (error) throw new Error("No se pudieron leer los estados de los procedimientos");
  return data;
}
