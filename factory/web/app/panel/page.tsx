import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getT } from '../../lib/i18n-server';
import { leerSesion } from '../../lib/panel-sesion';
import { FormularioEntrar } from './entrar-form';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t('pn.titulo')} · fábrica` };
}

export default async function EntrarPanel() {
  if (await leerSesion()) redirect('/panel/inicio');
  const t = await getT();
  return (
    <div className="fh-page">
      <header className="fh-topbar">
        <Link href="/" aria-label="fábrica">
          <span className="fh-marca">
            fábrica<span className="fh-punto">.</span>
          </span>
        </Link>
      </header>
      <main className="fh-panel">
        <div className="fh-tarjeta">
          <h1>{t('pn.entrar')}</h1>
          <p className="fh-tarjeta-sub">{t('pn.entrar.sub')}</p>
          <FormularioEntrar
            etiquetas={{
              correo: t('pn.correo'),
              clave: t('pn.clave'),
              enviar: t('pn.entrar'),
              enviando: t('pn.entrando'),
            }}
          />
        </div>
      </main>
    </div>
  );
}
