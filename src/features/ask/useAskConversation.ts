import { useState } from "react";

import type { ConversationTurn, Outcome, QueryColumn } from "./api";
import { classifyOutcome } from "./outcome";
import { streamQuery, type StreamEvent } from "./stream";

//: El backend acepta 3 turnos como maximo (QueryRequest.history).
const MAX_HISTORY = 3;

/**
 * En que va el turno. El orden sigue al pipeline del backend, que emite
 * sql -> row_count -> rows -> narrative -> done.
 */
export type TurnPhase = "translating" | "querying" | "writing" | "done";

export type Turn = {
  id: string;
  question: string;
  countries: string[];
  phase: TurnPhase;
  /** El SQL no se muestra; se guarda porque es lo que da contexto al
   * siguiente turno (ver buildHistory). */
  sql: string | null;
  columns: QueryColumn[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
  narrative: string | null;
  narrativeVerified: boolean;
  outcome: Outcome | null;
  /** La conexion fallo (red, servicio caido). Distinto de un outcome
   * FAILED_*, que es el servicio respondiendo que algo salio mal adentro. */
  failed: boolean;
};

function emptyTurn(id: string, question: string, countries: string[]): Turn {
  return {
    id,
    question,
    countries,
    phase: "translating",
    sql: null,
    columns: [],
    rows: [],
    rowCount: 0,
    truncated: false,
    narrative: null,
    narrativeVerified: false,
    outcome: null,
    failed: false,
  };
}

/**
 * Reducer puro de un evento del stream sobre un turno.
 *
 * Un evento `error` no marca la fase como terminada: el backend siempre
 * manda `done` despues, y esa es la unica señal de que el turno cerro.
 */
export function applyEvent(turn: Turn, event: StreamEvent): Turn {
  switch (event.type) {
    case "sql":
      return { ...turn, sql: event.sql, phase: "querying" };
    case "row_count":
      return { ...turn, rowCount: event.rowCount, truncated: event.truncated };
    case "rows":
      return { ...turn, columns: event.columns, rows: event.rows, phase: "writing" };
    case "narrative":
      return { ...turn, narrative: event.text, narrativeVerified: event.verified };
    case "error":
      return { ...turn, outcome: event.outcome };
    case "done":
      return { ...turn, outcome: event.outcome, phase: "done" };
  }
}

/**
 * Los ultimos turnos que de verdad respondieron, como contexto para resolver
 * un seguimiento ("¿y en Honduras?").
 *
 * Solo entran los que devolvieron datos: un turno fuera de dominio no tiene
 * SQL que continuar, y uno que fallo en la base tiene SQL pero es SQL que no
 * funciono -- pasarlo como ejemplo invita al modelo a repetirlo.
 */
export function buildHistory(turns: Turn[]): ConversationTurn[] {
  return turns
    .filter((turn) => {
      if (turn.phase !== "done" || !turn.sql || !turn.outcome) return false;
      const tone = classifyOutcome(turn.outcome);
      return tone === "ok" || tone === "zero" || tone === "degraded";
    })
    .slice(-MAX_HISTORY)
    .map((turn) => ({
      question: turn.question,
      countries: turn.countries,
      sql: turn.sql!,
    }));
}

/**
 * Historial de la conversacion. Vive fuera del panel para que cerrarlo y
 * volverlo a abrir no borre lo que ya se pregunto.
 *
 * Cada pregunta es una llamada real a Claude con costo real, asi que no hay
 * reintento automatico -- el backend ya reintenta la generacion de SQL
 * puertas adentro.
 */
export function useAskConversation() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [isPending, setIsPending] = useState(false);

  const ask = async (question: string, countries: string[]) => {
    const id = crypto.randomUUID();
    const history = buildHistory(turns);
    setTurns((current) => [...current, emptyTurn(id, question, countries)]);
    setIsPending(true);

    const update = (apply: (turn: Turn) => Turn) =>
      setTurns((current) => current.map((turn) => (turn.id === id ? apply(turn) : turn)));

    try {
      for await (const event of streamQuery({ question, countries, history })) {
        update((turn) => applyEvent(turn, event));
      }
      // Si el stream corto antes del `done`, el turno no puede quedarse
      // girando para siempre.
      update((turn) => (turn.phase === "done" ? turn : { ...turn, phase: "done", failed: true }));
    } catch {
      update((turn) => ({ ...turn, phase: "done", failed: true }));
    } finally {
      setIsPending(false);
    }
  };

  return { turns, ask, isPending };
}
