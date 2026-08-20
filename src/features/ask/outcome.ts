import type { Outcome } from "./api";

/**
 * Agrupa los 17 codigos de la taxonomia del backend en las pocas familias que
 * la interfaz realmente distingue visualmente. La taxonomia completa importa
 * para depurar (queda en analytics.query_log); aqui solo interesa como se ve.
 */
export type OutcomeTone =
  "ok" | "zero" | "degraded" | "out_of_scope" | "rejected" | "failed" | "throttled";

export function classifyOutcome(outcome: Outcome): OutcomeTone {
  switch (outcome) {
    case "OK":
      return "ok";
    case "OK_ZERO_ROWS":
      return "zero";
    case "OK_DEGRADED_NARRATIVE":
      return "degraded";
    case "OUT_OF_SCOPE":
      return "out_of_scope";
    case "THROTTLED_BUDGET":
    case "THROTTLED_QUOTA":
      return "throttled";
    case "FAILED_DB_TIMEOUT":
    case "FAILED_DB_ERROR":
    case "FAILED_LLM_ERROR":
      return "failed";
    default:
      // REJECTED_SQL_*, REJECTED_ENTITY_*: el sistema decidio no ejecutar nada.
      return "rejected";
  }
}
