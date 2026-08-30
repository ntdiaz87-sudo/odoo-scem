'use client';

/**
 * Idioma del visitante en el cliente: contexto + selector.
 *
 * El idioma llega ya resuelto desde el servidor, así que el primer render
 * coincide y no hay parpadeo. El selector guarda la elección en una cookie y
 * recarga para que el servidor vuelva a pintar en el idioma nuevo.
 */
import { createContext, useContext } from 'react';
import { LOCALES, Locale, NOMBRE_IDIOMA, NOMBRE_IDIOMA_CORTO, translate } from '../lib/i18n';

const Ctx = createContext<Locale>('zh');

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>;
}

export function useLocale(): Locale {
  return useContext(Ctx);
}

/** Traductor para componentes de cliente. */
export function useT() {
  const locale = useContext(Ctx);
  return (k: string, v?: Record<string, string>) => translate(locale, k, v);
}

export function SelectorIdioma({ compacto = false }: { compacto?: boolean }) {
  const actual = useLocale();

  function elegir(l: Locale) {
    if (l === actual) return;
    // Un año; el idioma es una preferencia, no una sesión.
    document.cookie = `fabrica_idioma=${l}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  return (
    <div className={`fh-idiomas${compacto ? ' es-compacto' : ''}`} role="group" aria-label="语言 / Idioma">
      {LOCALES.map(l => (
        <button
          key={l}
          type="button"
          className={l === actual ? 'es-activo' : ''}
          aria-pressed={l === actual}
          onClick={() => elegir(l)}
        >
          <b>{NOMBRE_IDIOMA[l]}</b>
          <i>{NOMBRE_IDIOMA_CORTO[l]}</i>
        </button>
      ))}
    </div>
  );
}
