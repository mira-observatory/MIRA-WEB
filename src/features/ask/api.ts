import { api } from "../../api/client";
import type { components } from "../../api/generated/schema";
import { copy } from "../../i18n/copy";

export type QueryResponse = components["schemas"]["QueryResponse"];
export type QueryColumn = components["schemas"]["Column"];
export type Outcome = components["schemas"]["Outcome"];

export type ConversationTurn = components["schemas"]["ConversationTurn"];

export const QUERY_PATH = "/query";

export async function fetchQueryResult(input: {
  question: string;
  countries: string[];
  history?: ConversationTurn[];
}): Promise<QueryResponse> {
  const { data, error } = await api.POST(QUERY_PATH, {
    body: {
      question: input.question,
      countries: input.countries,
      narrative: true,
      entity_ids: [],
      history: input.history ?? [],
    },
  });
  if (error) {
    const detail = Array.isArray(error.detail)
      ? error.detail.map((item) => item.msg).join(" ")
      : copy.errors.invalidQuestionOrCountries;
    throw new Error(detail);
  }
  return data;
}
