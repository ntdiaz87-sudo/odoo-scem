/**
 * Piezas visuales del home: iconos lineales y las tres maquetas de tienda que
 * viven dentro de los teléfonos del hero. Todo es CSS/SVG: no se carga
 * ninguna imagen externa.
 *
 * Componentes de servidor puros (sin estado, sin 'use client').
 */

/* ---------- iconos lineales ---------- */

const ico = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconCursor() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <path d="m5 3 6.5 16 2.2-6.6L20 10.2z" />
    </svg>
  );
}
export function IconWand() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <path d="M4 20 15 9" />
      <path d="m17.5 3-.9 2.4-2.4.9 2.4.9.9 2.4.9-2.4 2.4-.9-2.4-.9z" />
      <path d="m6.5 4-.6 1.5-1.5.6 1.5.6.6 1.5.6-1.5 1.5-.6-1.5-.6z" />
    </svg>
  );
}
export function IconPublish() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <path d="M12 16V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
    </svg>
  );
}
export function IconDevices() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <rect x="3" y="4" width="11" height="14" rx="1.6" />
      <rect x="15.5" y="9" width="5.5" height="11" rx="1.4" />
      <path d="M7 21h4" />
    </svg>
  );
}
export function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.3 3.3 5.2 3.3 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.3-5.2-3.3-8.5S9.8 5.8 12 3.5Z" />
    </svg>
  );
}
export function IconAgent() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <rect x="4" y="7.5" width="16" height="12" rx="3" />
      <path d="M12 4v3.5" />
      <circle cx="9" cy="13.5" r="1.1" />
      <circle cx="15" cy="13.5" r="1.1" />
      <path d="M9.8 16.8h4.4" />
    </svg>
  );
}
export function IconBox() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8z" />
      <path d="m4 8 8 4.5L20 8" />
      <path d="M12 12.5V20.5" />
    </svg>
  );
}
export function IconLock() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <rect x="4.5" y="10" width="15" height="11" rx="2.4" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <path d="M12 14.5v2.5" />
    </svg>
  );
}
export function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/* ---------- teléfono ---------- */

export function Telefono({
  variante,
  etiqueta,
  children,
}: {
  variante: 'izq' | 'centro' | 'der';
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`fh-phone fh-phone--${variante}`} role="img" aria-label={etiqueta}>
      <div className="fh-phone-marco">
        <span className="fh-phone-isla" aria-hidden="true" />
        <div className="fh-phone-pantalla">{children}</div>
      </div>
    </div>
  );
}
