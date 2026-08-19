import { SparkIcon } from "../../../components/icons";
import { classifyOutcome } from "../outcome";
import type { Turn } from "../useAskConversation";
import { ResultTable } from "./ResultTable";
import { StatusPanel } from "./StatusPanel";

function QuestionBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-isthmus px-4 py-2.5 font-sans text-sm leading-relaxed text-white">
        {text}
      </p>
    </div>
  );
}

function AnswerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-1 grid h-7 w-7 flex-none place-items-center rounded-full bg-gradient-to-br from-[#eaf7f6] to-[#f4f8f8] text-quetzal"
      >
        <SparkIcon size={15} />
      </span>
      <div className="min-w-0 flex-1 space-y-3">{children}</div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <AnswerShell>
      <p className="flex items-center gap-2 font-sans text-sm text-ink-soft" aria-live="polite">
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-quetzal [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-quetzal [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-quetzal" />
        </span>
        Buscando en los datos…
      </p>
    </AnswerShell>
  );
}

/**
 * Un turno completo: la pregunta y su respuesta.
 *
 * Orden dentro de la respuesta: primero la prosa, despues la tabla. Es lo
 * contrario al orden de un informe (README: "datos arriba, prosa abajo"),
 * pero en un chat la frase que abre ("Claro, a continuacion te muestro...")
 * es justamente lo que presenta la tabla. La distincion dato/prosa se
 * sostiene igual: la insignia "generado por IA", la serif para el parrafo,
 * la monoespaciada para la tabla, y los numeros del parrafo sin resaltar.
 */
export function AskTurn({ turn }: { turn: Turn }) {
  return (
    <div className="space-y-4">
      <QuestionBubble text={turn.question} />
      {turn.failed ? (
        <AnswerShell>
          <StatusPanel tone="failed" />
        </AnswerShell>
      ) : !turn.response ? (
        <ThinkingBubble />
      ) : (
        <AnswerTurn response={turn.response} />
      )}
    </div>
  );
}

function AnswerTurn({ response }: { response: NonNullable<Turn["response"]> }) {
  const tone = classifyOutcome(response.outcome);

  if (tone === "out_of_scope" || tone === "rejected" || tone === "failed" || tone === "throttled") {
    return (
      <AnswerShell>
        <StatusPanel tone={tone} />
      </AnswerShell>
    );
  }

  const isTemplateOnly = tone === "zero" || tone === "degraded";
  return (
    <AnswerShell>
      {response.narrative && (
        <div>
          <p
            className={
              isTemplateOnly
                ? "font-sans text-sm leading-relaxed text-ink-soft"
                : "font-display text-[16px] leading-relaxed text-ink"
            }
          >
            {response.narrative}
          </p>
          {!isTemplateOnly && (
            <p className="mt-1.5 flex flex-wrap items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              Generado por IA
              {response.narrative_verified && (
                <span className="rounded-full bg-quetzal/10 px-2 py-0.5 normal-case tracking-normal text-quetzal">
                  Verificado contra los datos
                </span>
              )}
            </p>
          )}
        </div>
      )}
      {response.row_count > 0 && (
        <ResultTable
          columns={response.columns}
          rows={response.rows}
          rowCount={response.row_count}
          truncated={response.truncated}
        />
      )}
    </AnswerShell>
  );
}
