import { loadStoreInfo } from '../../../../lib/store-design';
import { CartView } from './cart-view';

export const dynamic = 'force-dynamic';

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await loadStoreInfo(slug);
  if (!info) {
    return (
      <main className="wizard" style={{ textAlign: 'center' }}>
        <h1>Tienda no encontrada</h1>
      </main>
    );
  }
  return <CartView slug={slug} design={info.design} name={info.name} headingFont={info.headingFont} />;
}
