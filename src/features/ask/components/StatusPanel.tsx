import { useCopy, type Copy } from "../../../i18n";

export type StatusTone = "out_of_scope" | "rejected" | "failed" | "throttled" | "invalid";

// Funcion y no constante: el texto depende del idioma activo.
function statusCopyByTone(
  copy: Copy,
): Record<StatusTone, { title: string; body: string; className: string }> {
  return {
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

export function StatusPanel({ tone }: { tone: StatusTone }) {
  const copy = useCopy();
  const statusCopy = statusCopyByTone(copy)[tone];
  return (
    <div className={`rounded-2xl border px-6 py-5 ${statusCopy.className}`}>
      <p className="font-sans text-base font-semibold">{statusCopy.title}</p>
      <p className="mt-1.5 font-sans text-sm opacity-90">{statusCopy.body}</p>
    </div>
  );
}
