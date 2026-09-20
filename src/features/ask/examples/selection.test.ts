import { afterEach, describe, expect, it, vi } from "vitest";
import { EXAMPLE_QUESTIONS } from "./catalog";
import { selectExamples } from "./selection";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

function storage(initialValue: string | null = null) {
  let value = initialValue;
  const sessionStorage = {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, next: string) => {
      value = next;
    }),
  };
  vi.stubGlobal("window", { sessionStorage });
  return sessionStorage;
}

describe("catalogo de ejemplos", () => {
  it("ofrece 100 preguntas unicas con traduccion en ambos idiomas", () => {
    expect(EXAMPLE_QUESTIONS).toHaveLength(100);
    expect(new Set(EXAMPLE_QUESTIONS.map(({ id }) => id)).size).toBe(100);
    for (const language of ["es", "en"] as const) {
      const texts = EXAMPLE_QUESTIONS.map(({ text }) => text[language]);
      expect(texts.every((text) => text.trim().length > 0)).toBe(true);
      expect(new Set(texts).size).toBe(100);
    }
  });

  it("elige cuatro temas diferentes sin modificar el catalogo", () => {
    const original = [...EXAMPLE_QUESTIONS];
    for (const random of [() => 0, () => 0.5, () => 0.999999]) {
      const selected = selectExamples(random);
      expect(selected).toHaveLength(4);
      expect(new Set(selected.map(({ category }) => category)).size).toBe(4);
      expect(selected.every((example) => EXAMPLE_QUESTIONS.includes(example))).toBe(true);
    }
    expect(EXAMPLE_QUESTIONS).toEqual(original);
    expect(selectExamples(() => 0)).not.toEqual(selectExamples(() => 0.999999));
  });
});

describe("ejemplos por sesion", () => {
  it("conserva la seleccion al navegar y al recargar el modulo", async () => {
    const saved = storage();
    const { getSessionExamples } = await import("./selection");
    const selected = getSessionExamples();
    expect(getSessionExamples()).toBe(selected);
    expect(saved.setItem).toHaveBeenCalledTimes(1);
    // Simula una recarga: desaparece la cache del modulo, sessionStorage sigue.
    vi.resetModules();
    const reloaded = await import("./selection");
    expect(reloaded.getSessionExamples()).toEqual(selected);
    expect(saved.setItem).toHaveBeenCalledTimes(1);
  });

  it("una nueva sesion puede elegir otras preguntas", async () => {
    storage();
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    const first = (await import("./selection")).getSessionExamples();
    vi.resetModules();
    storage();
    random.mockReturnValue(0.999999);
    const next = (await import("./selection")).getSessionExamples();
    expect(next).not.toEqual(first);
  });

  it.each([
    "{json incompleto",
    "null",
    '["medicine-purchases"]',
    '["removed-id","computers","road-construction","textbooks"]',
    '["medicine-purchases","medicine-purchases","computers","textbooks"]',
    '["medicine-purchases","medical-equipment","computers","textbooks"]',
  ])("reemplaza una seleccion guardada invalida: %s", async (invalid) => {
    const saved = storage(invalid);
    const { getSessionExamples } = await import("./selection");
    const selected = getSessionExamples();
    expect(selected).toHaveLength(4);
    expect(new Set(selected.map(({ category }) => category)).size).toBe(4);
    expect(saved.setItem).toHaveBeenCalledTimes(1);
  });

  it("mantiene la seleccion en memoria si el navegador bloquea sessionStorage", async () => {
    vi.stubGlobal("window", {
      get sessionStorage() {
        throw new Error("Storage blocked");
      },
    });
    const { getSessionExamples } = await import("./selection");
    const selected = getSessionExamples();
    expect(selected).toHaveLength(4);
    expect(getSessionExamples()).toBe(selected);
  });

  it("conserva la seleccion cuando se puede leer pero no escribir", async () => {
    const saved = storage();
    saved.setItem.mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    const { getSessionExamples } = await import("./selection");
    const selected = getSessionExamples();
    expect(getSessionExamples()).toBe(selected);
  });
});
