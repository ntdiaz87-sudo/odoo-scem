import { loadStoreInfo } from '../../../../lib/store-design';
import { rootDomain } from '../../../../lib/tenant';
import { MarcoTienda, StoreNotFound } from '../_shell';
import { CheckoutForm } from './checkout-form';

const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || `http://${rootDomain()}`;

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await loadStoreInfo(slug);
  if (!info) return <StoreNotFound rootUrl={ROOT_URL} />;
  return (
    <MarcoTienda slug={slug} info={info} rootUrl={ROOT_URL} clase="st-flujo">
      <CheckoutForm slug={slug} nombre={info.name} />
    </MarcoTienda>
  );
}
