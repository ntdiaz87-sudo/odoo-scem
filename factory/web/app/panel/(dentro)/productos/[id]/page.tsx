import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SIMBOLO_DE } from '../../../../../lib/i18n';
import { getT } from '../../../../../lib/i18n-server';
import { verProducto } from '../../../../../lib/panel-datos';
import { exigirSesionPagina } from '../../../../../lib/panel-sesion';
import { FormularioProducto } from '../form';

export const dynamic = 'force-dynamic';

export default async function EditarProducto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await exigirSesionPagina();
  const t = await getT(s.mercado);
  const { producto } = await verProducto(s, id);
  if (!producto) notFound();
  const v = producto.variants[0];

  return (
    <>
      <Link className="pn-volver" href="/panel/productos">
        <span aria-hidden="true">←</span> {t('pn.pr.volver')}
      </Link>
      <h1 className="pn-h1">{producto.name}</h1>
      <FormularioProducto
        modo="editar"
        inicial={{
          id: producto.id,
          varianteId: v?.id || '',
          nombre: producto.name,
          descripcion: producto.description || '',
          precio: v ? (v.price / 100).toFixed(2) : '',
          stock: String(v?.stockOnHand ?? 0),
          publicado: producto.enabled,
          fotos: producto.fotos,
        }}
        etiquetas={{
          nombre: t('pn.pr.nombre'),
          desc: t('pn.pr.desc'),
          precio: t('pn.pr.precio'),
          stock: t('pn.pr.stock'),
          foto: t('pn.pr.foto'),
          fotoAyuda: t('pn.pr.foto.ayuda'),
          sinfoto: t('pn.pr.sinfoto'),
            simbolo: SIMBOLO_DE[s.mercado],
            portada: t('pn.pr.portada'),
            quitar: t('pn.pr.quitarfoto'),
          publicado: t('pn.pr.publicado'),
          enviar: t('pn.pr.guardar'),
          enviando: t('pn.pr.guardando'),
        }}
      />
    </>
  );
}
