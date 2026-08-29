import { api } from "../../api/client";
import type { components } from "../../api/generated/schema";
import { getCopy } from "../../i18n";
import type { ManualEntityType } from "./manualSearch";

export type EntityCandidate = components["schemas"]["EntityCandidate"];

export const ENTITY_RESOLVE_PATH = "/entities/resolve";

export async function resolveEntities(input: {
  q: string;
  type: ManualEntityType;
  countries: string[];
}): Promise<EntityCandidate[]> {
  const { data, error } = await api.GET(ENTITY_RESOLVE_PATH, {
    params: { query: input },
  });
  if (error) throw new Error(getCopy().manualSearch.entityUnavailable);
  return data;
}
