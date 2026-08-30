import { getT } from '../../../../lib/i18n-server';
import { exigirSesionPagina } from '../../../../lib/panel-sesion';
import { storeUrl } from '../../../../lib/tenant';
import { FormularioTienda } from './form';

export const dynamic = 'force-dynamic';

export default async function Tienda() {
  const s = await exigirSesionPagina();
  const t = await getT(s.mercado);
  const url = storeUrl(s.canal.token);

  return (
    <>
      <h1 className="pn-h1">{t('pn.ti.titulo')}</h1>

      <section className="pn-bloque">
        <FormularioTienda
          inicial={{ nombre: s.nombre, mercado: s.mercado, ...s.promesas }}
          etiquetas={{
            nombre: t('pn.ti.nombre'),
            mercado: t('pn.ti.mercado'),
            mercadoAyuda: t('pn.ti.mercado.ayuda'),
            promesas: t('pn.ti.promesas'),
            promesasAyuda: t('pn.ti.promesas.ayuda'),
            entregaPlazo: t('pn.ti.entrega'),
            entregaPlazoPh: t('pn.ti.entrega.ph'),
            entregaNota: t('pn.ti.entrega.nota'),
            entregaNotaPh: t('pn.ti.entrega.nota.ph'),
            pagoFormas: t('pn.ti.pago'),
            pagoFormasPh: t('pn.ti.pago.ph'),
            atencionNota: t('pn.ti.atencion'),
            atencionNotaPh: t('pn.ti.atencion.ph'),
            enviar: t('pn.pr.guardar'),
            enviando: t('pn.pr.guardando'),
          }}
        />
      </section>

      <section className="pn-bloque">
        <h2 className="pn-h2">{t('pn.ti.direccion')}</h2>
        <a className="pn-url" href={url}>
          {url}
        </a>
      </section>

      <section className="pn-bloque">
        <h2 className="pn-h2">{t('pn.ti.canales')}</h2>
        <p className="pn-ayuda">{t('pn.ti.canales.sub')}</p>
        <a className="fh-btn fh-btn--linea-oscura" href={`/canales/${s.canal.token}`}>
          {t('pn.ti.abrir')}
        </a>
      </section>

      <section className="pn-bloque pn-bloque--tenue">
        <h2 className="pn-h2">{t('pn.ti.avanzado')}</h2>
        <p className="pn-ayuda">{t('pn.ti.avanzado.sub')}</p>
        <a className="pn-enlace-sec" href="/dashboard">
          {t('pn.ti.abrir')} <span aria-hidden="true">↗</span>
        </a>
      </section>
    </>
  );
}
