/**
 * Idioma de la interfaz.
 *
 * Es un store a nivel de modulo, no un Context de React, porque buena parte del
 * texto se lee fuera de componentes: mensajes de error en `stream.ts`, formato
 * en `format.ts`, etiquetas de columna en `columnLabels.ts` y la frase que
 * `manualSearch.ts` construye para la IA. Ahi no hay hooks disponibles.
 *
 * Los componentes usan `useCopy()`, que se suscribe a los cambios; el resto
 * llama a `getCopy()` en el momento de usar el texto -- nunca lo guarda en una
 * constante de modulo, o se quedaria congelado en el idioma de arranque.
 */
import { useSyncExternalStore } from "react";

import { copyEn } from "./copy.en";
import { copyEs, type Copy } from "./copy.es";

export type { Copy };

export type Language = "es" | "en";

export const LANGUAGES: Language[] = ["es", "en"];

const STORAGE_KEY = "mira.language";

const DICTIONARIES: Record<Language, Copy> = {
  es: copyEs,
  en: copyEn,
};

/**
 * Locale para Intl cuando el dato no manda uno propio. En espanol se conserva
 * el del pais (es-GT, es-HN...) porque son cifras locales; en ingles se unifica.
 */
export const INTL_LOCALE: Record<Language, string> = {
  es: "es",
  en: "en-US",
};

/**
 * Arranca en espanol a proposito. La deteccion del navegador vive solo en
 * `main.tsx`: si este modulo mirara `navigator.language` por su cuenta, las
 * pruebas (jsdom reporta en-US) empezarian a leer el diccionario equivocado.
 */
let current: Language = "es";

const listeners = new Set<() => void>();

function isLanguage(value: unknown): value is Language {
  return value === "es" || value === "en";
}

export function getLanguage(): Language {
  return current;
}

export function getCopy(): Copy {
  return DICTIONARIES[current];
}

export function setLanguage(language: Language): void {
  if (language === current) return;
  current = language;
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Modo privado o almacenamiento bloqueado: el idioma sigue valiendo para
    // esta visita, solo no se recuerda en la siguiente.
  }
  document.documentElement.lang = language;
  listeners.forEach((listener) => listener());
}

/**
 * Idioma inicial: lo que el visitante eligio la ultima vez y, si nunca eligio,
 * el del navegador. Se llama una vez desde `main.tsx`.
 */
export function initLanguage(): Language {
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }
  if (isLanguage(stored)) {
    current = stored;
  } else {
    current = navigator.language?.toLowerCase().startsWith("en") ? "en" : "es";
  }
  document.documentElement.lang = current;
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** El texto de la interfaz, revaluado cuando cambia el idioma. */
export function useCopy(): Copy {
  return useSyncExternalStore(subscribe, getCopy, getCopy);
}

/** El idioma activo, para el selector y para elegir locale de Intl. */
export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, getLanguage, getLanguage);
}

/**
 * Nombre del pais para un codigo ISO. Los codigos llegan del backend en
 * mayuscula y el catalogo los indexa en minuscula.
 *
 * Vive aqui porque lo necesitan tres sitios que antes tenian cada uno su propia
 * copia del mapa -- y las tres copias eran constantes de modulo, es decir, se
 * habrian quedado congeladas en el idioma de arranque.
 */
export function countryName(code: string): string {
  const byId = getCopy().countries.byId;
  const entry = byId[code.toLowerCase() as keyof Copy["countries"]["byId"]];
  return entry ? entry.name : code.toUpperCase();
}
