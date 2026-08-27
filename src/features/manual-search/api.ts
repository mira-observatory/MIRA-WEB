import { api } from "../../api/client";
import type { components } from "../../api/generated/schema";
import { copy } from "../../i18n/copy";
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
  if (error) throw new Error(copy.manualSearch.entityUnavailable);
  return data;
}
