import { FormEvent, useMemo, useState } from "react";

type IconName =
  | "building"
  | "calendar"
  | "database"
  | "document"
  | "globe"
  | "handshake"
  | "monitor"
  | "pill"
  | "refresh"
  | "search"
  | "send"
  | "shield"
  | "spark";

function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M6.1 8a7 7 0 0 1 11.7-2L20 8M4 16l2.2 2a7 7 0 0 0 11.7-2" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </>
    ),
    document: (
      <>
        <path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h6M9 16h6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 5 5" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-8 20-4-8-8-4zM10 14 22 2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10zM9 12l2 2 4-5" />
      </>
    ),
    spark: (
      <>
        <path d="M9 18h6M10 22h4M8.5 14.5A7 7 0 1 1 16 14c-1.3 1-1.8 2-2 3h-4c-.2-1-.6-1.7-1.5-2.5z" />
      </>
    ),
    building: (
      <>
        <path d="M4 21V8l8-4 8 4v13M2 21h20M8 10v2M12 10v2M16 10v2M8 15v2M12 15v2M16 15v2" />
      </>
    ),
    pill: (
      <>
        <path d="M8.4 18.6a5 5 0 0 1-7-7l7.2-7.2a5 5 0 0 1 7 7zM5 8l7 7" />
      </>
    ),
    monitor: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
    handshake: (
      <>
        <path d="m8 12 3 3c1 1 2.5-.5 1.5-1.5l-2-2M14 8l-2-1-3 3-2-2-4 4 6 6c1 1 2.5-.5 1.5-1.5M13 15c1 1 2.5-.5 1.5-1.5M15 13.5c1 1 2.5-.5 1.5-1.5l-4-4 2-2 3 2 2-1 3 4-3 3" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const countries = [
  { id: "gt", name: "Guatemala", flag: "🇬🇹", active: true },
  { id: "hn", name: "Honduras", flag: "🇭🇳", active: true },
  { id: "cr", name: "Costa Rica", flag: "🇨🇷", active: true },
  { id: "sv", name: "El Salvador", flag: "🇸🇻", active: false },
];
const examples: { icon: IconName; text: string }[] = [
  { icon: "building", text: "¿Qué empresas recibieron más contratos en Honduras en 2025?" },
  { icon: "pill", text: "Muéstrame compras de medicamentos en los países seleccionados." },
  { icon: "monitor", text: "¿Cuánto se contrató en equipo de cómputo en Costa Rica en 2024?" },
  { icon: "handshake", text: "¿Qué instituciones hicieron más compras por adjudicación directa?" },
];

function Brand() {
  return (
    <header className="brand" aria-label="MIRA">
      <div className="brand-mark">
        <span>M</span>
        <span className="mark-dots">⌁</span>
      </div>
      <div>
        <div className="brand-name">MIRA</div>
        <div className="brand-expansion">
          MONITOREO <b>•</b> INFORMACIÓN <b>•</b> TRANSPARENCIA
        </div>
        <div className="brand-promise">
          Información pública de contrataciones,
          <br />
          simple, trazable y regional.
        </div>
      </div>
      <div className="region-dots" aria-hidden="true">
        ⠐⠘⠰
        <br />
        ⠀⠈⠘⠰
        <br />
        ⠀⠀⠀⠈⠘⠰
      </div>
    </header>
  );
}

export function App() {
  const [selected, setSelected] = useState(["gt", "hn", "cr"]),
    [question, setQuestion] = useState(""),
    [notice, setNotice] = useState("");
  const allActiveSelected = useMemo(
    () => countries.filter((c) => c.active).every((c) => selected.includes(c.id)),
    [selected],
  );
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setNotice(
      question.trim()
        ? "Consulta preparada. La conexión con MIRA API se habilitará próximamente."
        : "Escribe una pregunta para comenzar.",
    );
  };
  return (
    <div className="site-shell">
      <main className="page">
        <Brand />
        <section className="metrics card" aria-label="Resumen de cobertura">
          <div className="metric">
            <Icon name="globe" size={38} />
            <div>
              <small>Países disponibles</small>
              <strong className="tabular">3 activos</strong>
              <span>1 próximamente</span>
            </div>
          </div>
          <div className="metric">
            <Icon name="calendar" size={38} />
            <div>
              <small>Cobertura disponible</small>
              <strong className="tabular">Ene 2021 – Ago 2026</strong>
              <span>por país</span>
            </div>
          </div>
          <div className="metric">
            <Icon name="refresh" size={38} />
            <div>
              <small>Última actualización</small>
              <strong className="tabular">10 ago 2026</strong>
              <span className="tabular">08:30 a. m. (GMT−6)</span>
            </div>
          </div>
          <div className="metric">
            <Icon name="database" size={38} />
            <div>
              <small>Registros disponibles</small>
              <strong className="tabular">1,248,736</strong>
              <span>registros normalizados</span>
            </div>
          </div>
          <div className="metric">
            <Icon name="document" size={38} />
            <div>
              <small>Fuentes activas</small>
              <strong className="tabular">12</strong>
              <span>en 3 países</span>
            </div>
          </div>
        </section>
        <section className="countries card">
          <h2>Selecciona uno o más países</h2>
          <div className="country-grid">
            {countries.map((country) => (
              <button
                key={country.id}
                disabled={!country.active}
                onClick={() => toggle(country.id)}
                className={`country ${selected.includes(country.id) ? "selected" : ""}`}
              >
                <span className="checkbox" aria-hidden="true">
                  {selected.includes(country.id) ? "✓" : ""}
                </span>
                <span className="flag">{country.flag}</span>
                <span>
                  {country.name}
                  {!country.active && <small>Próximamente</small>}
                </span>
              </button>
            ))}
            <button
              className={`country all ${allActiveSelected ? "selected" : ""}`}
              onClick={() =>
                setSelected(
                  allActiveSelected ? [] : countries.filter((c) => c.active).map((c) => c.id),
                )
              }
            >
              <span className="checkbox" aria-hidden="true">
                {allActiveSelected ? "✓" : ""}
              </span>
              <Icon name="globe" />
              <span>Todos los países</span>
            </button>
          </div>
        </section>
        <section className="ask card">
          <div className="ask-heading">
            <h2>¿Qué quieres saber?</h2>
            <p>Escribe tu pregunta en lenguaje natural y MIRA buscará la información por ti.</p>
          </div>
          <form className="search-box" onSubmit={submit}>
            <Icon name="search" size={30} />
            <input
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setNotice("");
              }}
              aria-label="Pregunta"
              placeholder="Ejemplo: ¿Qué empresas recibieron más contratos de medicamentos en los países seleccionados entre 2024 y 2025?"
            />
            <button type="submit">
              <Icon name="send" />
              Consultar
            </button>
          </form>
          <div className="trust-row">
            <p>
              <Icon name="shield" size={20} />
              MIRA usa información pública oficial y siempre muestra la fuente de cada resultado.
            </p>
            <button
              onClick={() =>
                document.getElementById("examples")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Icon name="spark" />
              Ver ejemplos
            </button>
          </div>
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          <h3 id="examples">Ejemplos de preguntas</h3>
          <div className="examples">
            {examples.map((example) => (
              <button
                key={example.text}
                onClick={() => {
                  setQuestion(example.text);
                  setNotice("");
                }}
                className="example"
              >
                <span className="example-icon">
                  <Icon name={example.icon} size={30} />
                </span>
                <span>{example.text}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <span>
          <strong>MIRA</strong> · Monitoreo Inteligente Regional de Adquisiciones
        </span>
        <span>Una iniciativa de Centro Carter y Universidad Rafael Landívar</span>
        <span>
          Versión del prototipo 0.1 <b>·</b> Agosto 2026
        </span>
      </footer>
    </div>
  );
}
