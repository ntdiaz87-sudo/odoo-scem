import Link from 'next/link';
import { getT } from '../../../../../lib/i18n-server';
import { FormularioProducto } from '../form';

export const dynamic = 'force-dynamic';

export default async function NuevoProducto() {
  const t = await getT();
  return (
    <>
      <Link className="pn-volver" href="/panel/productos">
        <span aria-hidden="true">←</span> {t('pn.pr.volver')}
      </Link>
      <h1 className="pn-h1">{t('pn.pr.nuevo')}</h1>
      <FormularioProducto
        modo="crear"
        inicial={{ id: '', varianteId: '', nombre: '', descripcion: '', precio: '', stock: '10', publicado: true, foto: null }}
        etiquetas={{
          nombre: t('pn.pr.nombre'),
          desc: t('pn.pr.desc'),
          precio: t('pn.pr.precio'),
          stock: t('pn.pr.stock'),
          foto: t('pn.pr.foto'),
          fotoAyuda: t('pn.pr.foto.ayuda'),
          sinfoto: t('pn.pr.sinfoto'),
          publicado: t('pn.pr.publicado'),
          enviar: t('pn.pr.crear'),
          enviando: t('pn.pr.guardando'),
        }}
      />
    </>
  );
}
