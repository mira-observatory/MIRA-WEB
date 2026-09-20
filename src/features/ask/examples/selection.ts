import { EXAMPLE_QUESTIONS, type ExampleQuestion } from "./catalog";

const STORAGE_KEY = "mira.example-questions.v1";
const VISIBLE_COUNT = 4;
let sessionExamples: readonly ExampleQuestion[] | undefined;

// Una pregunta por tema: cuatro tarjetas distintas sin sesgar la eleccion
// mediante sort(Math.random), ni modificar el catalogo compartido.
export function selectExamples(random = Math.random): ExampleQuestion[] {
  let available = [...EXAMPLE_QUESTIONS];
  const selected: ExampleQuestion[] = [];
  while (selected.length < VISIBLE_COUNT && available.length > 0) {
    const example = available[Math.floor(random() * available.length)]!;
    selected.push(example);
    available = available.filter(({ category }) => category !== example.category);
  }
  return selected;
}

function restoreExamples(stored: string | null): ExampleQuestion[] | undefined {
  if (!stored) return;
  const ids: unknown = JSON.parse(stored);
  if (!Array.isArray(ids) || ids.length !== VISIBLE_COUNT) return;
  const examples = ids.map((id) => EXAMPLE_QUESTIONS.find((example) => example.id === id));
  if (examples.some((example) => !example)) return;
  const restored = examples as ExampleQuestion[];
  if (new Set(restored.map(({ category }) => category)).size !== VISIBLE_COUNT) return;
  return restored;
}

/** Conserva los mismos IDs al recargar o navegar; el idioma se aplica al pintar. */
export function getSessionExamples(): readonly ExampleQuestion[] {
  if (sessionExamples) return sessionExamples;
  try {
    sessionExamples = restoreExamples(window.sessionStorage.getItem(STORAGE_KEY));
  } catch {
    // JSON viejo o almacenamiento bloqueado: elegir una seleccion nueva.
  }
  if (!sessionExamples) {
    sessionExamples = selectExamples();
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(sessionExamples.map(({ id }) => id)),
      );
    } catch {
      // La cache del modulo conserva la seleccion durante la navegacion.
    }
  }
  return sessionExamples;
}
