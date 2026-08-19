type Props = { sql: string };

/**
 * "El SQL ejecutado se muestra, colapsable, para cualquier usuario. Es la
 * prueba de que el numero no fue inventado." -- README de este repo.
 * Colapsado por defecto para no competir con los datos, pero siempre presente
 * y nunca detras de un rol o permiso especial.
 */
export function SqlDisclosure({ sql }: Props) {
  return (
    <details className="group rounded-2xl border border-rule bg-paper-raised px-4 py-3 open:pb-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-sans text-sm font-semibold text-isthmus">
        <span
          aria-hidden="true"
          className="inline-block transition-transform duration-150 group-open:rotate-90"
        >
          ›
        </span>
        Ver el SQL ejecutado
      </summary>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-ink px-4 py-3 font-mono text-xs leading-relaxed text-paper">
        <code>{sql}</code>
      </pre>
    </details>
  );
}
