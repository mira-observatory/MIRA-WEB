import { FormEvent, useEffect, useRef, useState } from "react";

import { ArrowUpIcon } from "../../components/icons";
import { MiraLogo } from "../../components/icons/MiraLogo";
import { copy } from "../../i18n/copy";
import { AskTurn } from "./components/AskTurn";
import type { Turn } from "./useAskConversation";

const COUNTRY_LABEL: Record<string, string> = {
  GT: copy.countries.byId.gt.name,
  HN: copy.countries.byId.hn.name,
  CR: copy.countries.byId.cr.name,
  SV: copy.countries.byId.sv.name,
  NI: copy.countries.byId.ni.name,
  PA: copy.countries.byId.pa.name,
};

type Props = {
  open: boolean;
  onClose: () => void;
  turns: Turn[];
  countries: string[];
  isPending: boolean;
  onAsk: (question: string) => void;
};

/**
 * Panel de conversación a pantalla completa en escritorio y móvil.
 * Se expande desde la vista principal con una transición suave y centrada.
 */
export function AskPanel({ open, onClose, turns, countries, isPending, onAsk }: Props) {
  const [followUp, setFollowUp] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Escape cierra, y mientras está abierto la página de atrás no debe desplazarse
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Cada turno nuevo baja la vista automáticamente
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, isPending]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = followUp.trim();
    if (!trimmed || isPending) return;
    onAsk(trimmed);
    setFollowUp("");
  };

  const hasText = followUp.trim().length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.askPanel.dialogLabel}
      className={`fixed inset-0 z-50 flex flex-col bg-paper transition-all duration-300 ease-out ${
        open
          ? "opacity-100 scale-100 pointer-events-auto"
          : "opacity-0 scale-[0.98] pointer-events-none"
      }`}
      aria-hidden={!open}
      {...(open ? {} : { inert: "" })}
    >
      {/* Cabecera Superior Completa */}
      <header className="flex flex-none items-center justify-between border-b border-rule bg-paper-raised px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <MiraLogo className="h-8 w-8 flex-none" />
          <div className="min-w-0">
            <p className="font-sans text-sm font-semibold text-ink">{copy.askPanel.title}</p>
            <p className="truncate font-sans text-xs text-ink-soft">
              {countries.length > 0
                ? countries
                    .map((code) => COUNTRY_LABEL[code] ?? code)
                    .join(copy.askPanel.countrySeparator)
                : copy.countries.emptySelection}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={copy.askPanel.closeLabel}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-rule/60 bg-paper text-xl leading-none text-ink-faint transition hover:border-isthmus/40 hover:bg-paper-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-isthmus"
        >
          ×
        </button>
      </header>

      {/* Área Central de Conversación */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="mx-auto w-full max-w-4xl lg:max-w-5xl space-y-6">
          {turns.map((turn) => (
            <AskTurn key={turn.id} turn={turn} />
          ))}
        </div>
      </div>

      {/* Barra Inferior de Entrada */}
      <div className="flex-none border-t border-rule bg-paper-raised px-4 sm:px-8 py-3.5 shadow-sm">
        <form
          onSubmit={submit}
          className="mx-auto flex w-full max-w-4xl lg:max-w-5xl items-center gap-2.5"
        >
          <div className="relative flex flex-1 items-center">
            <input
              ref={inputRef}
              value={followUp}
              onChange={(event) => setFollowUp(event.target.value)}
              aria-label={copy.askPanel.followUpLabel}
              placeholder={copy.askPanel.followUpPlaceholder}
              className={`w-full rounded-2xl border border-rule bg-paper px-4 py-2.5 font-sans text-sm text-ink outline-none placeholder:text-ink-faint focus:border-isthmus-light focus:bg-paper-raised transition ${
                hasText ? "pr-11" : ""
              }`}
            />
            {hasText && (
              <button
                type="submit"
                disabled={isPending}
                aria-label={copy.askPanel.send}
                title={copy.askPanel.send}
                className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#05aaa1] to-[#079c83] text-white shadow-sm transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 animate-in fade-in zoom-in-75 duration-150"
              >
                <ArrowUpIcon size={16} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
