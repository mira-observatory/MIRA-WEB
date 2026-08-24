import { FormEvent, useEffect, useRef, useState } from "react";

import { SendIcon } from "../../components/icons";
import { MiraLogo } from "../../components/icons/MiraLogo";
import { copy } from "../../i18n/copy";
import { AskTurn } from "./components/AskTurn";
import type { Turn } from "./useAskConversation";

//: `flag` ya no es un emoji para mostrar -- desde que el selector usa SVG,
//: es solo el nombre del archivo ("GT"). Este subtitulo es texto plano, sin
//: espacio para un <img> por pais, asi que va solo el nombre.
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
 * Panel de conversacion. Se despliega sobre la pagina en vez de navegar a
 * otra ruta: la persona no pierde de vista donde estaba ni que paises tenia
 * seleccionados, y puede seguir preguntando sin volver atras.
 */
export function AskPanel({ open, onClose, turns, countries, isPending, onAsk }: Props) {
  const [followUp, setFollowUp] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Escape cierra, y mientras esta abierto la pagina de atras no debe
  // desplazarse por debajo del panel.
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

  // Cada turno nuevo (y el paso de "pensando" a respuesta) baja la vista.
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

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
      // Cerrado sigue montado (para no perder el historial), asi que hay que
      // sacarlo tambien del orden de tabulacion: aria-hidden solo lo esconde
      // del lector de pantalla, no impide que el Tab caiga en sus botones.
      {...(open ? {} : { inert: "" })}
    >
      <button
        type="button"
        aria-label={copy.askPanel.closeAssistantLabel}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/30 backdrop-blur-[2px]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={copy.askPanel.dialogLabel}
        className={`absolute right-0 top-0 flex h-full w-[min(760px,100%)] flex-col bg-paper shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex flex-none items-center gap-3 border-b border-rule bg-paper-raised px-5 py-3.5">
          <MiraLogo className="h-8 w-8 flex-none" />
          <div className="min-w-0 flex-1">
            <p className="font-sans text-sm font-semibold text-ink">{copy.askPanel.title}</p>
            <p className="truncate font-sans text-xs text-ink-soft">
              {countries.length > 0
                ? countries
                    .map((code) => COUNTRY_LABEL[code] ?? code)
                    .join(copy.askPanel.countrySeparator)
                : copy.countries.emptySelection}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.askPanel.closeLabel}
            className="flex-none rounded-lg px-2.5 py-1 font-sans text-xl leading-none text-ink-faint transition hover:bg-paper-sunken hover:text-ink"
          >
            ×
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-6">
            {turns.map((turn) => (
              <AskTurn key={turn.id} turn={turn} />
            ))}
          </div>
        </div>

        <form
          onSubmit={submit}
          className="flex flex-none items-center gap-2 border-t border-rule bg-paper-raised px-4 py-3"
        >
          <input
            ref={inputRef}
            value={followUp}
            onChange={(event) => setFollowUp(event.target.value)}
            aria-label={copy.askPanel.followUpLabel}
            placeholder={copy.askPanel.followUpPlaceholder}
            className="min-w-0 flex-1 rounded-xl border border-rule bg-paper-raised px-4 py-2.5 font-sans text-sm text-ink outline-none placeholder:text-ink-faint focus:border-isthmus-light"
          />
          <button
            type="submit"
            disabled={isPending || followUp.trim().length === 0}
            className="flex flex-none items-center gap-2 rounded-xl bg-gradient-to-br from-[#05aaa1] to-[#079c83] px-4 py-2.5 font-sans text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendIcon size={16} />
            {copy.askPanel.send}
          </button>
        </form>
      </aside>
    </div>
  );
}
