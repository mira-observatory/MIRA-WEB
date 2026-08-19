import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { fetchQueryResult, type ConversationTurn, type QueryResponse } from "./api";
import { classifyOutcome } from "./outcome";

//: El backend acepta 3 turnos como maximo (QueryRequest.history).
const MAX_HISTORY = 3;

export type Turn = {
  id: string;
  question: string;
  countries: string[];
  /** null mientras la peticion sigue en vuelo. */
  response: QueryResponse | null;
  /** El fetch fallo (red, 422, servicio caido) -- distinto de un outcome
   * FAILED_*, que es una respuesta valida del servicio diciendo que algo
   * salio mal adentro. */
  failed: boolean;
};

type AskVars = {
  id: string;
  question: string;
  countries: string[];
  history: ConversationTurn[];
};

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
      const response = turn.response;
      if (!response?.sql_executed) return false;
      const tone = classifyOutcome(response.outcome);
      return tone === "ok" || tone === "zero" || tone === "degraded";
    })
    .slice(-MAX_HISTORY)
    .map((turn) => ({
      question: turn.question,
      countries: turn.countries,
      sql: turn.response!.sql_executed!,
    }));
}

/**
 * Historial de la conversacion. Vive fuera del panel para que cerrarlo y
 * volverlo a abrir no borre lo que ya se pregunto.
 *
 * Cada pregunta es una llamada real a Claude con costo real (el presupuesto
 * la cobra antes de generar el SQL), asi que no hay reintento automatico --
 * el backend ya reintenta la generacion de SQL puertas adentro.
 */
export function useAskConversation() {
  const [turns, setTurns] = useState<Turn[]>([]);

  const { mutate, isPending } = useMutation({
    mutationFn: (vars: AskVars) =>
      fetchQueryResult({
        question: vars.question,
        countries: vars.countries,
        history: vars.history,
      }),
    retry: false,
    onMutate: (vars) =>
      setTurns((current) => [
        ...current,
        {
          id: vars.id,
          question: vars.question,
          countries: vars.countries,
          response: null,
          failed: false,
        } satisfies Turn,
      ]),
    onSuccess: (response, vars) =>
      setTurns((current) =>
        current.map((turn) => (turn.id === vars.id ? { ...turn, response } : turn)),
      ),
    onError: (_error, vars) =>
      setTurns((current) =>
        current.map((turn) => (turn.id === vars.id ? { ...turn, failed: true } : turn)),
      ),
  });

  const ask = (question: string, countries: string[]) =>
    mutate({
      id: crypto.randomUUID(),
      question,
      countries,
      history: buildHistory(turns),
    });

  return { turns, ask, isPending };
}
