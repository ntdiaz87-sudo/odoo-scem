import { SIMBOLO_DE, money } from '../../../../lib/i18n';
import { getT } from '../../../../lib/i18n-server';
import {
  informeDistribuidores,
  listarProductos,
  listarPromos,
} from '../../../../lib/panel-datos';
import { exigirSesionPagina } from '../../../../lib/panel-sesion';
import { storeUrl } from '../../../../lib/tenant';
import { accionBorrarPromo, accionQuitarDistribuidor } from '../../acciones';
import { FormularioCupon, FormularioDistribuidor, FormularioSeckill } from './formularios';

export const dynamic = 'force-dynamic';

export default async function Marketing() {
  const s = await exigirSesionPagina();
  const t = await getT(s.mercado);
  const [promos, distribuidores, { productos }] = await Promise.all([
    listarPromos(s),
    informeDistribuidores(s),
    listarProductos(s),
  ]);
  const base = storeUrl(s.canal.token);

  const comunes = { enviar: t('pn.mk.crear'), enviando: t('pn.pr.guardando') };

  return (
    <>
      <h1 className="pn-h1">{t('pn.nav.marketing')}</h1>

      <section className="pn-bloque">
        <h2 className="pn-h2">{t('pn.mk.promos.t')}</h2>
        {promos.length === 0 ? (
          <p className="pn-vacio">{t('pn.mk.promos.vacio')}</p>
        ) : (
          <ul className="pn-mk-lista">
            {promos.map(p => (
              <li key={p.id} className="pn-mk-promo">
                <span className="pn-mk-tipo">{p.esSeckill ? t('pn.mk.tipo.sk') : t('pn.mk.tipo.cupon')}</span>
                <span className="pn-mk-nombre">
                  {p.name}
                  {p.couponCode ? <code className="pn-mk-codigo">{p.couponCode}</code> : null}
                  {!p.enabled ? <em className="pn-mk-off">{t('pn.mk.apagada')}</em> : null}
                </span>
                <form action={accionBorrarPromo}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="pn-enlace-sec pn-mk-borrar" type="submit">
                    {t('pn.mk.borrar')}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pn-bloque">
        <h2 className="pn-h2">{t('pn.mk.cupon.t')}</h2>
        <p className="pn-ayuda">{t('pn.mk.cupon.d')}</p>
        <FormularioCupon
          simbolo={SIMBOLO_DE[s.mercado]}
          etiquetas={{
            nombre: t('pn.mk.cupon.nombre'),
            codigo: t('pn.mk.cupon.codigo'),
            tipo: t('pn.mk.cupon.tipo'),
            tipoPct: t('pn.mk.cupon.tipo.pct'),
            tipoFijo: t('pn.mk.cupon.tipo.fijo'),
            valor: t('pn.mk.cupon.valor'),
            minimo: t('pn.mk.cupon.minimo'),
            caduca: t('pn.mk.caduca'),
            ...comunes,
          }}
        />
      </section>

      <section className="pn-bloque">
        <h2 className="pn-h2">{t('pn.mk.sk.t')}</h2>
        <p className="pn-ayuda">{t('pn.mk.sk.d')}</p>
        <FormularioSeckill
          productos={productos.filter(p => p.enabled).map(p => ({ id: p.id, nombre: p.name }))}
          etiquetas={{
            nombre: t('pn.mk.cupon.nombre'),
            pct: t('pn.mk.sk.pct'),
            hasta: t('pn.mk.sk.hasta'),
            prods: t('pn.mk.sk.prods'),
            ...comunes,
          }}
        />
      </section>

      <section className="pn-bloque">
        <h2 className="pn-h2">{t('pn.mk.dis.t')}</h2>
        <p className="pn-ayuda">{t('pn.mk.dis.d')}</p>
        {distribuidores.length === 0 ? (
          <p className="pn-vacio">{t('pn.mk.dis.vacio')}</p>
        ) : (
          <div className="pn-tabla-envuelta">
            <table className="pn-tabla">
              <thead>
                <tr>
                  <th>{t('pn.mk.dis.nombre')}</th>
                  <th>{t('pn.mk.dis.enlace')}</th>
                  <th>{t('pn.mk.dis.pedidos')}</th>
                  <th>{t('pn.mk.dis.vendido')}</th>
                  <th>{t('pn.mk.dis.comi')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {distribuidores.map(d => (
                  <tr key={d.codigo}>
                    <td>{d.nombre} · {d.comision}%</td>
                    <td>
                      <code className="pn-mk-codigo">{`${base}?d=${d.codigo}`}</code>
                    </td>
                    <td>{d.pedidos}</td>
                    <td>{money(d.vendido, s.moneda, s.mercado)}</td>
                    <td>{money(d.comisionGanada, s.moneda, s.mercado)}</td>
                    <td>
                      <form action={accionQuitarDistribuidor}>
                        <input type="hidden" name="codigo" value={d.codigo} />
                        <button className="pn-enlace-sec pn-mk-borrar" type="submit">
                          {t('pn.mk.dis.quitar')}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="pn-ayuda">{t('pn.mk.dis.nota')}</p>
        <FormularioDistribuidor
          etiquetas={{
            nombre: t('pn.mk.dis.nombre'),
            codigo: t('pn.mk.dis.codigo'),
            comision: t('pn.mk.dis.comision'),
            enviar: t('pn.mk.dis.agregar'),
            enviando: t('pn.pr.guardando'),
          }}
        />
      </section>
    </>
  );
}
