import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCopy, setLanguage } from "../../../i18n";
import type { Outcome } from "../api";
import { parseFrame } from "../stream";
import { applyEvent, buildHistory, type Turn } from "../useAskConversation";
import { AskTurn } from "./AskTurn";

function emptyTurn(): Turn {
  return {
    id: "clarification",
    question: "computadoras guatemala",
    countries: ["GT"],
    phase: "translating",
    sql: null,
    columns: [],
    rows: [],
    rowCount: 0,
    truncated: false,
    narrative: null,
    narrativeVerified: false,
    outcome: null,
    warnings: [],
    language: "es",
    failed: false,
  };
}

beforeEach(() => {
  vi.stubGlobal("document", { documentElement: { lang: "es" } });
});

afterEach(() => {
  setLanguage("es");
  vi.unstubAllGlobals();
});

describe.each(["es", "en"] as const)("mensajes en %s", (language) => {
  it.each([
    ["REJECTED_QUESTION_TOO_BROAD", "too_broad"],
    ["REJECTED_INTENT_UNCLEAR", "unclear"],
    ["FAILED_DB_ERROR", "failed"],
    ["FAILED_DB_TIMEOUT", "timeout"],
    ["FAILED_LLM_ERROR", "failed"],
    ["REJECTED_SQL_PARSE", "rejected"],
    ["OUT_OF_SCOPE", "out_of_scope"],
  ] as const)("muestra el mensaje correspondiente a %s desde SSE", (outcome, tone) => {
    setLanguage(language);
    let turn = emptyTurn();
    for (const event of ["error", "done"]) {
      const parsed = parseFrame(`event: ${event}\ndata: ${JSON.stringify({ outcome })}`);
      expect(parsed).not.toBeNull();
      turn = applyEvent(turn, parsed!);
    }
    expect(turn.outcome).toBe(outcome as Outcome);
    expect(turn.phase).toBe("done");
    expect(turn.failed).toBe(false);
    expect(buildHistory([turn])).toEqual([]);
    const html = renderToStaticMarkup(<AskTurn turn={turn} onRetry={() => {}} />);
    expect(html).toContain(getCopy().status[tone].title);
    expect(html).toContain(getCopy().status[tone].body);
    if (tone !== "failed") expect(html).not.toContain(getCopy().status.failed.title);
    expect(html).not.toContain("<table");
    expect(html).toContain(getCopy().askTurn.actions.copyQuestion);
    expect(html).toContain(getCopy().askTurn.actions.copyResponse);
    expect(html.includes(getCopy().askTurn.actions.retry)).toBe(
      tone === "failed" || tone === "timeout" || tone === "rejected",
    );
  });

  it("un corte de conexion indica reintentar, incluso con pregunta corta", () => {
    setLanguage(language);
    const html = renderToStaticMarkup(
      <AskTurn turn={{ ...emptyTurn(), phase: "done", failed: true }} />,
    );
    expect(html).toContain(getCopy().status.failed.title);
    expect(html).toContain(getCopy().status.failed.body);
  });

  it("conserva el mensaje de timeout si despues se corta el stream", () => {
    setLanguage(language);
    const html = renderToStaticMarkup(
      <AskTurn
        turn={{ ...emptyTurn(), phase: "done", failed: true, outcome: "FAILED_DB_TIMEOUT" }}
      />,
    );
    expect(html).toContain(getCopy().status.timeout.title);
    expect(html).not.toContain(getCopy().status.failed.title);
  });
});

describe("acciones individuales de la conversacion", () => {
  it("ofrece copiar tanto el texto de la respuesta como la tabla", () => {
    const turn: Turn = {
      ...emptyTurn(),
      phase: "done",
      outcome: "OK",
      narrative: "Hay 10 procesos.",
      columns: [{ name: "process_count", kind: "number", currency_code: null }],
      rows: [{ process_count: 10 }],
      rowCount: 1,
    };
    const html = renderToStaticMarkup(<AskTurn turn={turn} />);
    expect(html).toContain(getCopy().askTurn.actions.copyQuestion);
    expect(html).toContain(getCopy().askTurn.actions.copyResponse);
    expect(html).toContain(getCopy().askTurn.actions.copyTable);
  });

  it("permite copiar un aviso que ocupa el lugar de la respuesta", () => {
    const html = renderToStaticMarkup(
      <AskTurn
        turn={{
          ...emptyTurn(),
          phase: "done",
          outcome: "OK_ZERO_ROWS",
          warnings: [{ code: "NO_DATA", message_es: "Sin datos del período" }],
        }}
      />,
    );
    expect(html).toContain(getCopy().askTurn.actions.copyResponse);
  });

  it("deshabilita reintentar mientras se procesa otra pregunta", () => {
    const html = renderToStaticMarkup(
      <AskTurn
        turn={{ ...emptyTurn(), phase: "done", failed: true }}
        onRetry={() => {}}
        isPending
      />,
    );
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>/);
    expect(html).toContain(getCopy().askTurn.actions.retry);
  });
});
