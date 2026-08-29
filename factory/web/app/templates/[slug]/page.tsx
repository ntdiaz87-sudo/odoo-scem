import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getT } from '../../../lib/i18n-server';
import { PLANTILLAS, PLANTILLAS_POR_ID, etiquetaCategoria } from '../../../lib/plantillas';
import { VistaPrevia } from './vista';

export function generateStaticParams() {
  return PLANTILLAS.map(p => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PLANTILLAS_POR_ID[slug];
  return { title: p ? `${p.nombre} · fábrica` : 'fábrica' };
}

export default async function PreviaPlantilla({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PLANTILLAS_POR_ID[slug];
  if (!p) notFound();
  const [locale, t] = await Promise.all([getLocale(), getT()]);

  return (
    <div className="v-previa">
      <header className="v-previa-barra">
        <Link className="v-previa-volver" href="/#templates">
          <span aria-hidden="true">←</span> {t('v.tpl.volver')}
        </Link>
        <span className="v-previa-titulo">
          <b>{p.nombre}</b>
          <em>{etiquetaCategoria(p.categoria, locale)}</em>
        </span>
        <Link className="v-btn v-btn--acento" href={`/demo?plantilla=${p.id}`}>
          {t('v.tpl.usar')}
        </Link>
      </header>

      <VistaPrevia
        p={p}
        locale={locale}
        etiquetas={{ escritorio: t('v.tpl.escritorio'), movil: t('v.tpl.movil'), aviso: t('v.tpl.reutilizable') }}
      />
    </div>
  );
}
