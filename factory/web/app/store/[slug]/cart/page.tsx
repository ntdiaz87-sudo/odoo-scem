import { loadStoreInfo } from '../../../../lib/store-design';
import { rootDomain } from '../../../../lib/tenant';
import { MarcoTienda, StoreNotFound } from '../_shell';
import { CartView } from './cart-view';

const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || `http://${rootDomain()}`;

export const dynamic = 'force-dynamic';

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await loadStoreInfo(slug);
  if (!info) return <StoreNotFound rootUrl={ROOT_URL} />;
  return (
    <MarcoTienda slug={slug} info={info} rootUrl={ROOT_URL} clase="st-flujo" activo="carrito">
      <CartView slug={slug} />
    </MarcoTienda>
  );
}
