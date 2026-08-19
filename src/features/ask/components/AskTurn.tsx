import { SparkIcon } from "../../../components/icons";
import { classifyOutcome } from "../outcome";
import type { Turn, TurnPhase } from "../useAskConversation";
import { ResultTable } from "./ResultTable";
import { StatusPanel } from "./StatusPanel";

const PHASE_LABEL: Record<Exclude<TurnPhase, "done">, string> = {
  translating: "Entendiendo tu pregunta…",
  querying: "Consultando la base de datos…",
  writing: "Redactando la respuesta…",
};

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

function PhaseStatus({ phase }: { phase: Exclude<TurnPhase, "done"> }) {
  return (
    <p className="flex items-center gap-2 font-sans text-sm text-ink-soft" aria-live="polite">
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-quetzal [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-quetzal [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-quetzal" />
      </span>
      {PHASE_LABEL[phase]}
    </p>
  );
}

function Narrative({ text, verified, plain }: { text: string; verified: boolean; plain: boolean }) {
  if (plain) {
    return <p className="font-sans text-sm leading-relaxed text-ink-soft">{text}</p>;
  }
  return (
    <div>
      <p className="font-display text-[16px] leading-relaxed text-ink">{text}</p>
      <p className="mt-1.5 flex flex-wrap items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
        Generado por IA
        {verified && (
          <span className="rounded-full bg-quetzal/10 px-2 py-0.5 normal-case tracking-normal text-quetzal">
            Verificado contra los datos
          </span>
        )}
      </p>
    </div>
  );
}

/**
 * Un turno completo: la pregunta y su respuesta.
 *
 * El orden vertical no cambia mientras llega el stream -- la respuesta arriba
 * y la tabla debajo como evidencia. Lo que ocupa el lugar del parrafo
 * mientras se redacta es el estado en curso, no un spinner mudo; y la tabla
 * aparece apenas hay filas, sin esperar a que la redaccion termine. Asi se ve
 * antes sin que nada salte de lugar.
 */
export function AskTurn({ turn }: { turn: Turn }) {
  return (
    <div className="space-y-4">
      <QuestionBubble text={turn.question} />
      <AnswerShell>
        <AnswerBody turn={turn} />
      </AnswerShell>
    </div>
  );
}

function AnswerBody({ turn }: { turn: Turn }) {
  if (turn.failed) return <StatusPanel tone="failed" />;

  const tone = turn.outcome ? classifyOutcome(turn.outcome) : null;

  // Rechazo, fuera de dominio, fallo o limite: no hay tabla que mostrar.
  if (tone === "out_of_scope" || tone === "rejected" || tone === "failed" || tone === "throttled") {
    return <StatusPanel tone={tone} />;
  }

  // La plantilla determinista del backend (cero filas, o narrativa que el
  // verificador descarto) no debe vestirse como prosa generada.
  const plainNarrative = tone === "zero" || tone === "degraded";

  return (
    <>
      {turn.phase !== "done" ? (
        <PhaseStatus phase={turn.phase} />
      ) : (
        turn.narrative && (
          <Narrative
            text={turn.narrative}
            verified={turn.narrativeVerified}
            plain={plainNarrative}
          />
        )
      )}
      {turn.rowCount > 0 && turn.columns.length > 0 && (
        <ResultTable
          columns={turn.columns}
          rows={turn.rows}
          rowCount={turn.rowCount}
          truncated={turn.truncated}
        />
      )}
    </>
  );
}
