import type { Config } from "tailwindcss";

/**
 * Tokens heredados del prototipo original (MIRA-ETL/web/index.html).
 *
 * La regla que sostiene el diseno: la tipografia monoespaciada marca todo lo que
 * viene de la base de datos —numeros, montos, identificadores, SQL—, y la serif
 * marca el texto generado por el modelo. Es la distincion visual entre dato y prosa,
 * y no debe romperse por conveniencia.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#16232B", soft: "#4A5A62", faint: "#7C8B92" },
        paper: { DEFAULT: "#F1F3EF", raised: "#FFFFFF", sunken: "#E7EAE4" },
        isthmus: { DEFAULT: "#0E3F5C", light: "#1C6690" },
        ember: "#C1502E",
        quetzal: "#2F6E5B",
        maize: "#D4A72C",
        rule: "#D3D8D2",
      },
      fontFamily: {
        // Datos: todo numero, monto, identificador y SQL.
        mono: ["IBM Plex Mono", "ui-monospace", "Consolas", "monospace"],
        // Interfaz.
        sans: ["Public Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        // Texto generado por el modelo.
        display: ["Fraunces", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
