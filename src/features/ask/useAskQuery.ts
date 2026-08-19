import { useQuery } from "@tanstack/react-query";

import { fetchQueryResult } from "./api";

export function useAskQuery(question: string, countries: string[]) {
  const normalisedCountries = countries.slice().sort();
  return useQuery({
    queryKey: ["ask-query", question, normalisedCountries],
    queryFn: () => fetchQueryResult({ question, countries }),
    enabled: question.length > 0 && countries.length > 0,
    // Cada llamada es una invocacion real a Claude con costo real (el
    // presupuesto la cobra antes de generar el SQL). Un reintento automatico
    // del cliente duplicaria ese gasto sin que el usuario lo pidiera -- el
    // propio backend ya reintenta la generacion de SQL puertas adentro.
    retry: false,
  });
}
