import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BuildingIcon,
  CalendarIcon,
  DatabaseIcon,
  DocumentIcon,
  GlobeIcon,
  HandshakeIcon,
  MonitorIcon,
  PillIcon,
  RefreshIcon,
  SearchIcon,
  SendIcon,
  ShieldIcon,
  SparkIcon,
} from "../components/icons";
import { MiraLogo } from "../components/icons/MiraLogo";

const countries = [
  { id: "gt", name: "Guatemala", flag: "🇬🇹", active: true },
  { id: "hn", name: "Honduras", flag: "🇭🇳", active: true },
  { id: "cr", name: "Costa Rica", flag: "🇨🇷", active: true },
  { id: "sv", name: "El Salvador", flag: "🇸🇻", active: false },
];
const examples = [
  { Icon: BuildingIcon, text: "¿Qué empresas recibieron más contratos en Honduras en 2025?" },
  { Icon: PillIcon, text: "Muéstrame compras de medicamentos en los países seleccionados." },
  { Icon: MonitorIcon, text: "¿Cuánto se contrató en equipo de cómputo en Costa Rica en 2024?" },
  {
    Icon: HandshakeIcon,
    text: "¿Qué instituciones hicieron más compras por adjudicación directa?",
  },
];

function Brand() {
  return (
    <header className="brand" aria-label="MIRA">
      <MiraLogo className="brand-mark" />
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
  const navigate = useNavigate();
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
    if (!question.trim()) {
      setNotice("Escribe una pregunta para comenzar.");
      return;
    }
    if (selected.length === 0) {
      setNotice("Selecciona al menos un país.");
      return;
    }
    const params = new URLSearchParams({
      q: question.trim(),
      countries: selected.join(","),
    });
    navigate(`/preguntar?${params.toString()}`);
  };
  return (
    <div className="site-shell">
      <main className="page">
        <Brand />
        <section className="metrics card" aria-label="Resumen de cobertura">
          <div className="metric">
            <GlobeIcon className="icon" size={38} />
            <div>
              <small>Países disponibles</small>
              <strong className="tabular">3 activos</strong>
              <span>1 próximamente</span>
            </div>
          </div>
          <div className="metric">
            <CalendarIcon className="icon" size={38} />
            <div>
              <small>Cobertura disponible</small>
              <strong className="tabular">Ene 2021 – Ago 2026</strong>
              <span>por país</span>
            </div>
          </div>
          <div className="metric">
            <RefreshIcon className="icon" size={38} />
            <div>
              <small>Última actualización</small>
              <strong className="tabular">10 ago 2026</strong>
              <span className="tabular">08:30 a. m. (GMT−6)</span>
            </div>
          </div>
          <div className="metric">
            <DatabaseIcon className="icon" size={38} />
            <div>
              <small>Registros disponibles</small>
              <strong className="tabular">1,248,736</strong>
              <span>registros normalizados</span>
            </div>
          </div>
          <div className="metric">
            <DocumentIcon className="icon" size={38} />
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
              <GlobeIcon className="icon" />
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
            <SearchIcon className="icon" size={30} />
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
              <SendIcon className="icon" />
              Consultar
            </button>
          </form>
          <div className="trust-row">
            <p>
              <ShieldIcon className="icon" size={20} />
              MIRA usa información pública oficial y siempre muestra la fuente de cada resultado.
            </p>
            <button
              onClick={() =>
                document.getElementById("examples")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <SparkIcon className="icon" />
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
                  <example.Icon className="icon" size={30} />
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
