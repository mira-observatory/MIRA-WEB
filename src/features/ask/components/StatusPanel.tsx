export type StatusTone = "out_of_scope" | "rejected" | "failed" | "throttled" | "invalid";

const COPY: Record<StatusTone, { title: string; body: string; className: string }> = {
  out_of_scope: {
    title: "Esta pregunta esta fuera de lo que MIRA puede responder hoy",
    body: "MIRA solo responde sobre procesos, adjudicaciones, compradores y proveedores de los paises disponibles. Intenta reformular tu pregunta.",
    className: "border-isthmus/20 bg-isthmus/5 text-isthmus",
  },
  rejected: {
    title: "No pudimos traducir tu pregunta a una consulta valida",
    body: "Intenta ser mas especifico: menciona el pais, el periodo o el tipo de dato que buscas.",
    className: "border-maize/30 bg-maize/10 text-[#8a6a15]",
  },
  failed: {
    title: "Hubo un error consultando los datos",
    body: "No fue un problema con tu pregunta -- intenta de nuevo en un momento.",
    className: "border-ember/25 bg-ember/5 text-ember",
  },
  throttled: {
    title: "MIRA alcanzo su limite de uso por ahora",
    body: "El servicio comparte un presupuesto diario entre todas las personas que preguntan. Intenta de nuevo mas tarde.",
    className: "border-ember/25 bg-ember/5 text-ember",
  },
  invalid: {
    title: "Falta una pregunta o un pais",
    body: "Vuelve al inicio, escribe tu pregunta y selecciona al menos un pais.",
    className: "border-rule bg-paper text-ink-soft",
  },
};

export function StatusPanel({ tone }: { tone: StatusTone }) {
  const copy = COPY[tone];
  return (
    <div className={`rounded-2xl border px-6 py-5 ${copy.className}`}>
      <p className="font-sans text-base font-semibold">{copy.title}</p>
      <p className="mt-1.5 font-sans text-sm opacity-90">{copy.body}</p>
    </div>
  );
}
