import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { fetchQueryResult, type QueryResponse } from "./api";

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

type AskVars = { id: string; question: string; countries: string[] };

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
      fetchQueryResult({ question: vars.question, countries: vars.countries }),
    retry: false,
    onMutate: (vars) =>
      setTurns((current) => [
        ...current,
        { ...vars, response: null, failed: false } satisfies Turn,
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
    mutate({ id: crypto.randomUUID(), question, countries });

  return { turns, ask, isPending };
}
