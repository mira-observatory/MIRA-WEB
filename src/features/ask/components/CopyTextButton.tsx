import { useEffect, useState } from "react";

import { CheckIcon, CopyIcon } from "../../../components/icons";
import { useCopy } from "../../../i18n";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CopyTextButton({ text, label }: { text: string; label: string }) {
  const copy = useCopy();
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [state]);

  const caption =
    state === "copied"
      ? copy.askTurn.actions.copied
      : state === "failed"
        ? copy.askTurn.actions.copyFailed
        : label;

  return (
    <button
      type="button"
      onClick={async () => setState((await copyText(text)) ? "copied" : "failed")}
      title={label}
      aria-label={caption}
      className="inline-flex items-center gap-1.5 rounded-lg border border-rule/60 bg-paper px-2.5 py-1 font-sans text-xs font-medium text-ink-soft transition hover:border-isthmus/40 hover:bg-paper-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-isthmus"
    >
      {state === "copied" ? (
        <CheckIcon size={14} className="text-quetzal" />
      ) : (
        <CopyIcon size={14} />
      )}
      <span aria-live="polite" className={state === "copied" ? "text-quetzal" : ""}>
        {caption}
      </span>
    </button>
  );
}
