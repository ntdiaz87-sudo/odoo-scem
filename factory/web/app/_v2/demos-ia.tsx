'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

/* Las tres piezas de esta sección son DEMOSTRACIONES DE INTERFAZ. No hay
   modelo de lenguaje conectado todavía, así que no ejecutan nada: lo dicen
   con una etiqueta visible, porque prometer en el home lo que el producto no
   hace es la forma más rápida de perder a un comerciante en la primera
   semana. Cuando llegue la clave del modelo, se sustituye el guion por la
   llamada real y la interfaz no cambia. */

function useEnPantalla<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [dentro, setDentro] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      es => es.forEach(e => e.isIntersecting && setDentro(true)),
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, dentro };
}

const reducido = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ====================== cambia una vez, se sincroniza ==================== */

export function DemoSync({ etiquetas }: { etiquetas: Record<string, string> }) {
  const { ref, dentro } = useEnPantalla<HTMLDivElement>();
  const [paso, setPaso] = useState(0); // 0 quieto · 1 orden · 2 aplicado
  const [reinicio, setReinicio] = useState(0);

  // Ojo: el efecto NO puede depender de `paso`. Si depende, al pasar a 1 se
  // ejecuta la limpieza y cancela el temporizador del paso 2, y la demo se
  // queda congelada a medias. Depende solo de que la sección esté a la vista.
  const arranque = useRef(0);
  useEffect(() => {
    if (!dentro) return;
    const sello = arranque.current;
    if (reducido()) { setPaso(2); return; }
    const a = setTimeout(() => { if (arranque.current === sello) setPaso(1); }, 700);
    const b = setTimeout(() => { if (arranque.current === sello) setPaso(2); }, 2100);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [dentro, reinicio]);

  function reiniciar() {
    arranque.current += 1;
    setPaso(0);
    setReinicio(v => v + 1);
  }

  const canales = [
    { k: 'Web', ico: 'M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z' },
    { k: 'H5', ico: 'M7 2h10v20H7zM11 18h2' },
    { k: '微信', ico: 'M9 4c4 0 7 2.5 7 5.6S13 15 9 15a9 9 0 0 1-2.3-.3L4 16l.8-2.3A5.9 5.9 0 0 1 2 9.6C2 6.5 5 4 9 4z' },
  ];

  return (
    <div className="v-sync" ref={ref}>
      <span className="v-etiqueta-demo">{etiquetas.demo}</span>

      <div className="v-sync-fila">
        <article className="v-sync-prod">
          <div className="v-sync-foto">
            <Image src="/img/blanco-reloj.png" alt="" width={300} height={300} sizes="160px" />
          </div>
          <p className="v-sync-n">{etiquetas.producto}</p>
          <p className={`v-sync-precio${paso >= 2 ? ' is-nuevo' : ''}`}>
            <s>¥899</s>
            <b>¥799</b>
          </p>
        </article>

        <div className={`v-sync-orden${paso >= 1 ? ' is-on' : ''}`}>
          <span className="v-sync-agente">
            <i />
            {etiquetas.agente}
          </span>
          <p>{etiquetas.orden}</p>
        </div>

        <div className="v-sync-canales">
          {canales.map((c, k) => (
            <div key={c.k} className={`v-sync-canal${paso >= 2 ? ' is-on' : ''}`} style={{ transitionDelay: `${k * 130}ms` }}>
              <span className="v-sync-canal-cab">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d={c.ico} />
                </svg>
                {c.k}
                <i className="v-sync-tick" />
              </span>
              <b>{paso >= 2 ? '¥799' : '¥899'}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="v-sync-pie">
        <button type="button" className="v-btn v-btn--linea v-btn--mini" onClick={reiniciar}>
          {etiquetas.reiniciar}
        </button>
        <span className="v-aviso-demo">{etiquetas.aviso}</span>
      </div>
    </div>
  );
}

/* ========================= fábrica de productos ========================== */

export function DemoFabrica({ etiquetas }: { etiquetas: Record<string, string> }) {
  const { ref, dentro } = useEnPantalla<HTMLDivElement>();
  const [n, setN] = useState(0);
  const checks = [etiquetas.c1, etiquetas.c2, etiquetas.c3, etiquetas.c4, etiquetas.c5, etiquetas.c6];

  useEffect(() => {
    if (!dentro) return;
    if (reducido()) { setN(checks.length); return; }
    if (n >= checks.length) return;
    const t = setTimeout(() => setN(v => v + 1), n === 0 ? 500 : 340);
    return () => clearTimeout(t);
  }, [dentro, n, checks.length]);

  return (
    <div className="v-fab" ref={ref}>
      <span className="v-etiqueta-demo">{etiquetas.demo}</span>

      <div className="v-fab-fila">
        <div className="v-fab-entrada">
          <div className="v-fab-foto">
            <Image src="/img/blanco-auriculares.png" alt="" width={400} height={400} sizes="220px" />
          </div>
          <ul>
            <li className="is-on">{etiquetas.e1}</li>
            <li>{etiquetas.e2}</li>
            <li>{etiquetas.e3}</li>
          </ul>
        </div>

        <div className="v-fab-flecha" aria-hidden="true">→</div>

        <div className="v-fab-analisis">
          <p className="v-fab-analisis-t">{etiquetas.analiza}</p>
          <ul>
            {checks.map((c, k) => (
              <li key={c} className={k < n ? 'is-on' : ''}>
                <i />
                {c}
              </li>
            ))}
          </ul>
        </div>

        <div className="v-fab-flecha" aria-hidden="true">→</div>

        <div className={`v-fab-salida${n >= checks.length ? ' is-on' : ''}`}>
          <div className="v-fab-foto v-fab-foto--sm">
            <Image src="/img/blanco-auriculares.png" alt="" width={300} height={300} sizes="130px" />
          </div>
          <p className="v-fab-salida-n">{etiquetas.salidaN}</p>
          <p className="v-fab-salida-p">
            <b>¥899</b>
            <s>¥1,099</s>
          </p>
          <span className="v-btn v-btn--acento v-btn--mini v-fab-salida-cta">{etiquetas.publicar}</span>
        </div>
      </div>
      <span className="v-aviso-demo">{etiquetas.aviso}</span>
    </div>
  );
}

/* ============================ fábrica. Command ========================== */

export function DemoComando({ etiquetas }: { etiquetas: Record<string, string> }) {
  const { ref, dentro } = useEnPantalla<HTMLDivElement>();
  const [escrito, setEscrito] = useState('');
  const [fase, setFase] = useState(0); // 0 escribiendo · 1 plan · 2 ejecutado

  useEffect(() => {
    if (!dentro || fase > 0) return;
    if (reducido()) { setEscrito(etiquetas.ej); setFase(1); return; }
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setEscrito(etiquetas.ej.slice(0, i));
      if (i >= etiquetas.ej.length) {
        clearInterval(t);
        setTimeout(() => setFase(1), 420);
      }
    }, 42);
    return () => clearInterval(t);
  }, [dentro, fase, etiquetas.ej]);

  function reiniciar() {
    setEscrito('');
    setFase(0);
  }

  return (
    <div className="v-cmd" ref={ref}>
      <span className="v-etiqueta-demo">{etiquetas.demo}</span>

      <div className="v-cmd-entrada">
        <span className="v-cmd-prompt" aria-hidden="true">›</span>
        <p>
          {escrito}
          {fase === 0 ? <i className="v-cmd-cursor" /> : null}
        </p>
      </div>

      <div className={`v-cmd-plan${fase >= 1 ? ' is-on' : ''}`}>
        <p className="v-cmd-plan-t">{etiquetas.plan}</p>
        <ul>
          <li>{etiquetas.encontrado}</li>
          <li>{etiquetas.desc}</li>
          <li>{etiquetas.cuando}</li>
        </ul>
        {fase < 2 ? (
          <button type="button" className="v-btn v-btn--acento v-btn--mini" onClick={() => setFase(2)}>
            {etiquetas.aprobar}
          </button>
        ) : (
          <p className="v-cmd-hecho">
            <i />
            {etiquetas.hecho}
          </p>
        )}
      </div>

      <div className="v-cmd-pie">
        <button type="button" className="v-btn v-btn--linea v-btn--mini" onClick={reiniciar}>
          {etiquetas.reiniciar}
        </button>
        <span className="v-aviso-demo">{etiquetas.aviso}</span>
      </div>
    </div>
  );
}
