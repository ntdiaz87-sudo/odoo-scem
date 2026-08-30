'use client';

/**
 * Idioma y moneda de UNA tienda, para sus componentes de cliente.
 *
 * Ojo con la diferencia, que es la que costó entender el fallo que reportó el
 * primer comerciante de fuera de China:
 *
 * - `t()` de lib/i18n traduce en el idioma del MERCADO, fijado en el build.
 *   Servía cuando la fábrica solo hacía tiendas chinas; con eso, un
 *   comerciante cubano recibía su tienda en chino y en yuanes.
 * - Esto de aquí traduce en el idioma de SU tienda, que él eligió al crearla y
 *   vive en su canal. No es la preferencia del visitante: la tienda de un
 *   comerciante chino se sirve en chino aunque el visitante tenga la fábrica
 *   en español, porque esa tienda es de su dueño y de su mercado.
 */
import { createContext, useContext } from 'react';
import { Locale, MONEDA_DE, translate } from './i18n';

export interface MercadoTienda {
  locale: Locale;
  moneda: string;
}

const Ctx = createContext<MercadoTienda>({ locale: 'zh', moneda: 'CNY' });

export function MercadoProvider({ valor, children }: { valor: MercadoTienda; children: React.ReactNode }) {
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useMercado(): MercadoTienda {
  return useContext(Ctx);
}

/** Traductor en el idioma de la tienda. */
export function useTt() {
  const { locale } = useContext(Ctx);
  return (k: string, v?: Record<string, string>) => translate(locale, k, v);
}

/** Precio en la moneda de la tienda y con el formato de su idioma. */
export function useDinero() {
  const { locale, moneda } = useContext(Ctx);
  return (minor: number, monedaDato?: string) =>
    new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale, {
      style: 'currency',
      currency: monedaDato || moneda || MONEDA_DE[locale],
    }).format(minor / 100);
}
