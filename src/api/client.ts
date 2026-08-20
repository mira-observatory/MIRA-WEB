import createClient from "openapi-fetch";

import type { paths } from "./generated/schema";

// credentials: "include" -- MIRA-API emite una cookie anonima (mira_subject) para
// atribuir el registro de auditoria a "la misma sesion de navegador". No limita
// nada por ahora (la cuota por sujeto sigue inactiva del lado del servicio), pero
// sin la cookie el fetch nunca la recibe ni la reenvia.
export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_MIRA_API_BASE_URL,
  credentials: "include",
});
