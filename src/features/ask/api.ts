import { api } from "../../api/client";
import type { components } from "../../api/generated/schema";

export type QueryResponse = components["schemas"]["QueryResponse"];
export type QueryColumn = components["schemas"]["Column"];
export type Outcome = components["schemas"]["Outcome"];

export type ConversationTurn = components["schemas"]["ConversationTurn"];

export async function fetchQueryResult(input: {
  question: string;
  countries: string[];
  history?: ConversationTurn[];
}): Promise<QueryResponse> {
  const { data, error } = await api.POST("/query", {
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
      : "La pregunta o los paises no son validos.";
    throw new Error(detail);
  }
  return data;
}
