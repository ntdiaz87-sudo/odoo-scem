import { loadStoreInfo } from '../../../../lib/store-design';
import { rootDomain } from '../../../../lib/tenant';
import { StoreFooter, StoreHeader, StoreNotFound, storeVars } from '../_shell';
import { ThanksView } from './thanks-view';

const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || `http://${rootDomain()}`;

export const dynamic = 'force-dynamic';

export default async function GraciasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await loadStoreInfo(slug);
  if (!info) return <StoreNotFound rootUrl={ROOT_URL} />;
  return (
    <div className="st" style={storeVars(info.design)}>
      <StoreHeader slug={slug} nombre={info.name} />
      <main className="st-flujo">
        <ThanksView slug={slug} nombre={info.name} />
      </main>
      <StoreFooter nombre={info.name} rootUrl={ROOT_URL} />
    </div>
  );
}
