import { useSearchParams } from "react-router-dom";

import { AskHeader } from "./components/AskHeader";
import { NarrativeBlock } from "./components/NarrativeBlock";
import { ResultTable } from "./components/ResultTable";
import { SqlDisclosure } from "./components/SqlDisclosure";
import { StatusPanel } from "./components/StatusPanel";
import { classifyOutcome } from "./outcome";
import { useAskQuery } from "./useAskQuery";
import type { QueryResponse } from "./api";

function parseCountries(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
}

function LoadingPanel() {
  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <div className="animate-pulse space-y-4">
        <div className="h-44 rounded-2xl bg-paper-sunken" />
        <div className="h-11 rounded-2xl bg-paper-sunken" />
        <div className="h-24 rounded-2xl bg-paper-sunken" />
      </div>
      <p className="text-center font-sans text-sm text-ink-soft">
        MIRA está traduciendo tu pregunta a una consulta y buscando los datos…
      </p>
    </div>
  );
}

/**
 * Orden vertical fijo (README): datos arriba, prosa abajo. El SQL cuenta como
 * parte de "datos" -- es la prueba de que el numero no fue inventado -- asi
 * que va entre la tabla y la narrativa, nunca despues.
 */
function ResultView({ data }: { data: QueryResponse }) {
  const tone = classifyOutcome(data.outcome);

  if (tone === "out_of_scope" || tone === "rejected" || tone === "failed" || tone === "throttled") {
    return (
      <div className="space-y-4">
        <StatusPanel tone={tone} />
        {data.sql_executed && <SqlDisclosure sql={data.sql_executed} />}
      </div>
    );
  }

  const isTemplateOnly = tone === "zero" || tone === "degraded";
  return (
    <div className="space-y-5">
      {data.row_count > 0 && (
        <ResultTable
          columns={data.columns}
          rows={data.rows}
          rowCount={data.row_count}
          truncated={data.truncated}
        />
      )}
      {data.sql_executed && <SqlDisclosure sql={data.sql_executed} />}
      {data.narrative && (
        <NarrativeBlock
          text={data.narrative}
          verified={data.narrative_verified}
          isTemplateOnly={isTemplateOnly}
        />
      )}
    </div>
  );
}

export function AskPage() {
  const [searchParams] = useSearchParams();
  const question = searchParams.get("q")?.trim() ?? "";
  const countries = parseCountries(searchParams.get("countries"));
  const isValidRequest = question.length > 0 && countries.length > 0;

  const { data, isLoading, isError } = useAskQuery(question, countries);

  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto w-[min(980px,94%)] py-10">
        <AskHeader question={isValidRequest ? question : "Sin pregunta"} countries={countries} />
        {!isValidRequest ? (
          <StatusPanel tone="invalid" />
        ) : isLoading ? (
          <LoadingPanel />
        ) : isError ? (
          <StatusPanel tone="failed" />
        ) : data ? (
          <ResultView data={data} />
        ) : null}
      </main>
    </div>
  );
}
