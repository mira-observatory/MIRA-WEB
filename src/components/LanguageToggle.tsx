import { LANGUAGES, setLanguage, useLanguage, type Language } from "../i18n";

const LABEL: Record<Language, string> = {
  es: "ES",
  en: "EN",
};

/**
 * Cambia el idioma de la interfaz. Deliberadamente pequeno: no compite con el
 * contenido, solo tiene que estar ahi para quien lo busque.
 *
 * El area tactil de cada boton llega a 32px con padding aunque el texto sea de
 * dos letras -- por debajo de eso es dificil de acertar en un movil.
 */
export function LanguageToggle() {
  const language = useLanguage();
  return (
    <div className="language-toggle" role="group" aria-label="Idioma / Language">
      {LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          className={code === language ? "selected" : ""}
          aria-pressed={code === language}
          lang={code}
          onClick={() => setLanguage(code)}
        >
          {LABEL[code]}
        </button>
      ))}
    </div>
  );
}
