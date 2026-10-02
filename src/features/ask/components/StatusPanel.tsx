import { useCopy, type Copy } from "../../../i18n";
import { RefreshIcon } from "../../../components/icons";
import { CopyTextButton } from "./CopyTextButton";

export type StatusTone =
  | "too_broad"
  | "unclear"
  | "out_of_scope"
  | "rejected"
  | "timeout"
  | "failed"
  | "throttled"
  | "invalid";

// Funcion y no constante: el texto depende del idioma activo.
function statusCopyByTone(
  copy: Copy,
): Record<StatusTone, { title: string; body: string; className: string }> {
  return {
    too_broad: {
      ...copy.status.too_broad,
      className: "border-maize/30 bg-maize/10 text-[#8a6a15]",
    },
    unclear: {
      ...copy.status.unclear,
      className: "border-maize/30 bg-maize/10 text-[#8a6a15]",
    },
    out_of_scope: {
      title: copy.status.out_of_scope.title,
      body: copy.status.out_of_scope.body,
      className: "border-isthmus/20 bg-isthmus/5 text-isthmus",
    },
    rejected: {
      title: copy.status.rejected.title,
      body: copy.status.rejected.body,
      className: "border-maize/30 bg-maize/10 text-[#8a6a15]",
    },
    timeout: {
      ...copy.status.timeout,
      className: "border-ember/25 bg-ember/5 text-ember",
    },
    failed: {
      title: copy.status.failed.title,
      body: copy.status.failed.body,
      className: "border-ember/25 bg-ember/5 text-ember",
    },
    throttled: {
      title: copy.status.throttled.title,
      body: copy.status.throttled.body,
      className: "border-ember/25 bg-ember/5 text-ember",
    },
    invalid: {
      title: copy.status.invalid.title,
      body: copy.status.invalid.body,
      className: "border-rule bg-paper text-ink-soft",
    },
  };
}

export function StatusPanel({
  tone,
  onRetry,
  isPending = false,
}: {
  tone: StatusTone;
  onRetry?: () => void;
  isPending?: boolean;
}) {
  const copy = useCopy();
  const statusCopy = statusCopyByTone(copy)[tone];
  return (
    <>
      <div className={`rounded-2xl border px-6 py-5 ${statusCopy.className}`}>
        <p className="font-sans text-base font-semibold">{statusCopy.title}</p>
        <p className="mt-1.5 font-sans text-sm opacity-90">{statusCopy.body}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CopyTextButton
          text={`${statusCopy.title}\n\n${statusCopy.body}`}
          label={copy.askTurn.actions.copyResponse}
        />
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-isthmus/30 bg-paper px-2.5 py-1 font-sans text-xs font-medium text-isthmus transition hover:bg-isthmus/5 focus-visible:ring-2 focus-visible:ring-isthmus disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshIcon size={14} />
            {copy.askTurn.actions.retry}
          </button>
        )}
      </div>
    </>
  );
}
