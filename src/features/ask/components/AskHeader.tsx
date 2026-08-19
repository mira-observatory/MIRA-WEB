import { Link } from "react-router-dom";

import { MiraLogo } from "../../../components/icons/MiraLogo";

const COUNTRY_LABEL: Record<string, string> = {
  GT: "🇬🇹 Guatemala",
  HN: "🇭🇳 Honduras",
  CR: "🇨🇷 Costa Rica",
  SV: "🇸🇻 El Salvador",
  NI: "🇳🇮 Nicaragua",
  PA: "🇵🇦 Panamá",
};

type Props = { question: string; countries: string[] };

export function AskHeader({ question, countries }: Props) {
  return (
    <header className="mb-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 font-sans text-sm font-medium text-isthmus hover:text-isthmus-light"
      >
        <MiraLogo className="h-6 w-6" />← Nueva pregunta
      </Link>
      <h1 className="mt-4 font-sans text-xl font-semibold leading-snug text-ink">{question}</h1>
      {countries.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {countries.map((code) => (
            <span
              key={code}
              className="rounded-full border border-rule bg-white px-3 py-1 font-sans text-xs text-ink-soft"
            >
              {COUNTRY_LABEL[code] ?? code}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
