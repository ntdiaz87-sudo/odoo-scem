import { loadStoreInfo } from '../../../../lib/store-design';
import { rootDomain } from '../../../../lib/tenant';
import { MarcoTienda, StoreNotFound } from '../_shell';
import { ThanksView } from './thanks-view';

const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || `http://${rootDomain()}`;

export const dynamic = 'force-dynamic';

export default async function GraciasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await loadStoreInfo(slug);
  if (!info) return <StoreNotFound rootUrl={ROOT_URL} />;
  return (
    <MarcoTienda slug={slug} info={info} rootUrl={ROOT_URL} clase="st-flujo">
      <ThanksView slug={slug} nombre={info.name} />
    </MarcoTienda>
  );
}
