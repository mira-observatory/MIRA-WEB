/**
 * Andamiaje de la pantalla principal. La composicion real llega en la fase 1:
 *
 *   <IsthmusStrip />          selector de paises y mapa de cobertura a la vez
 *   <QuestionBox />           pregunta en lenguaje natural + filtros suaves
 *   <ResultProvenance />      conteo de filas, paises, rango  (datos, mono)
 *   <EntityCandidateList />   desambiguacion, si la hay       (datos, mono)
 *   <ResultTable />           tabla + SQL desplegable + CSV   (datos, mono)
 *   <AnswerNarrative />       lectura generada por IA         (prosa, serif)
 *
 * El orden importa: datos arriba, prosa abajo. No es una preferencia estetica,
 * es la jerarquia que impide que alguien lea el parrafo como si fuera la fuente.
 */
export function App() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl bg-paper px-6 py-16 text-ink">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-ember">
        MIRA · Observatorio de compras públicas
      </p>
      <h1 className="mt-5 font-display text-4xl font-semibold text-isthmus">
        Consultas en lenguaje natural
      </h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Los números provienen de la base de datos. El texto que los acompaña lo escribe un
        modelo de lenguaje y se verifica contra los datos antes de mostrarse.
      </p>
      <p className="mt-10 font-mono text-sm text-ink-faint">Fase 0 · andamiaje inicial</p>
    </main>
  );
}
