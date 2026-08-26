import type { ConversationTurn, Outcome, QueryColumn } from "./api";
import { copy } from "../../i18n/copy";

export type ResponseLanguage = "es" | "en";

export type QueryWarning = {
  code: string;
  message_es: string;
  /** El mismo aviso en ingles. Opcional: un backend viejo no lo manda. */
  message_en?: string | null;
};

/**
 * El aviso en el idioma de la respuesta, con el espanol como respaldo.
 *
 * Con cero filas este texto no es un adorno: es la respuesta entera, porque
 * el turno muestra el aviso en lugar del parrafo. Dejarlo vacio por no tener
 * traduccion seria peor que mostrarlo en el otro idioma.
 */
export function warningText(warning: QueryWarning, language: ResponseLanguage): string {
  return language === "en" && warning.message_en ? warning.message_en : warning.message_es;
}

export type StreamEvent =
  | { type: "sql"; sql: string }
  | { type: "row_count"; rowCount: number; truncated: boolean }
  | { type: "rows"; columns: QueryColumn[]; rows: Record<string, unknown>[] }
  | { type: "warnings"; warnings: QueryWarning[]; language: ResponseLanguage }
  | { type: "narrative"; text: string | null; verified: boolean }
  | { type: "error"; outcome: Outcome }
  | { type: "done"; outcome: Outcome };

export const QUERY_STREAM_PATH = "/query/stream";

/**
 * Traduce un frame SSE ("event: x\ndata: {...}") al evento tipado.
 * Devuelve null para lo que no reconoce -- un evento nuevo del backend no
 * debe romper un cliente viejo.
 */
export function parseFrame(frame: string): StreamEvent | null {
  let name = "";
  const dataLines: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) name = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (!name || dataLines.length === 0) return null;

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(dataLines.join("\n"));
  } catch {
    return null;
  }

  switch (name) {
    case "sql":
      return { type: "sql", sql: String(data.sql ?? "") };
    case "row_count":
      return {
        type: "row_count",
        rowCount: Number(data.row_count ?? 0),
        truncated: Boolean(data.truncated),
      };
    case "rows":
      return {
        type: "rows",
        columns: (data.columns ?? []) as QueryColumn[],
        rows: (data.rows ?? []) as Record<string, unknown>[],
      };
    case "warnings":
      return {
        type: "warnings",
        warnings: (data.warnings ?? []) as QueryWarning[],
        // Un backend anterior a esto no manda idioma: espanol, que es el default.
        language: data.language === "en" ? "en" : "es",
      };
    case "narrative":
      return {
        type: "narrative",
        text: (data.text ?? null) as string | null,
        verified: Boolean(data.verified),
      };
    case "error":
      return { type: "error", outcome: data.outcome as Outcome };
    case "done":
      return { type: "done", outcome: data.outcome as Outcome };
    default:
      return null;
  }
}

/**
 * Parte un buffer en frames completos (separados por linea en blanco) y
 * devuelve lo que quedo a medias, para concatenarlo con el proximo chunk.
 * Un chunk de red puede cortar un frame por la mitad; sin esto se perderia.
 */
export function drainFrames(buffer: string): { frames: string[]; rest: string } {
  const frames: string[] = [];
  let rest = buffer;
  let index = rest.indexOf("\n\n");
  while (index !== -1) {
    frames.push(rest.slice(0, index));
    rest = rest.slice(index + 2);
    index = rest.indexOf("\n\n");
  }
  return { frames, rest };
}

/**
 * POST /query/stream consumido como SSE.
 *
 * Es fetch a mano y no EventSource porque EventSource solo hace GET, y la
 * pregunta (con su historial) va en el cuerpo. `credentials: "include"` para
 * que viaje la cookie anonima con la que el backend atribuye la auditoria.
 */
export async function* streamQuery(input: {
  question: string;
  countries: string[];
  history: ConversationTurn[];
  signal?: AbortSignal;
}): AsyncGenerator<StreamEvent> {
  const response = await fetch(`${import.meta.env.VITE_MIRA_API_BASE_URL}${QUERY_STREAM_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal: input.signal,
    body: JSON.stringify({
      question: input.question,
      countries: input.countries,
      narrative: true,
      entity_ids: [],
      history: input.history,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`${copy.errors.serviceResponded} ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { frames, rest } = drainFrames(buffer);
      buffer = rest;
      for (const frame of frames) {
        const event = parseFrame(frame);
        if (event) yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
