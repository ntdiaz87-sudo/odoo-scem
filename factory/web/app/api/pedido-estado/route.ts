import { NextRequest, NextResponse } from 'next/server';
import { adminLogin, adminRequest } from '../../../lib/vendure';

/**
 * Estado público de un pedido: número de pedido + correo del comprador.
 *
 * No hay cuentas de cliente, así que esta es la única forma que tiene el
 * comprador de saber por dónde va su paquete sin escribirle a la tienda. El
 * par código+correo hace de llave: el código solo lo tiene quien compró (o
 * quien recibió su confirmación) y el correo tiene que coincidir con el del
 * pedido, así que un código filtrado no enseña la dirección de nadie que no
 * conozca también el correo.
 *
 * Se consulta con la credencial del servidor porque el shop-api solo enseña
 * el pedido a la sesión que lo creó, y esa cookie el comprador ya no la
 * tiene al día siguiente. El canal sale del slug del subdominio: un código de
 * otra tienda devuelve "no encontrado", no el pedido ajeno.
 */
export async function POST(req: NextRequest) {
  let cuerpo: { slug?: string; codigo?: string; correo?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: 'peticion' }, { status: 400 });
  }
  const slug = String(cuerpo.slug || '').toLowerCase();
  const codigo = String(cuerpo.codigo || '').trim();
  const correo = String(cuerpo.correo || '').trim().toLowerCase();
  if (!slug || !codigo || !correo) return NextResponse.json({ error: 'faltan' }, { status: 400 });

  try {
    const auth = await adminLogin();
    const data = await adminRequest<{
      orders: {
        items: Array<{
          code: string;
          state: string;
          orderPlacedAt: string | null;
          totalWithTax: number;
          currencyCode: string;
          customer: { emailAddress: string } | null;
          lines: Array<{ quantity: number; productVariant: { name: string } }>;
          fulfillments: Array<{ state: string; trackingCode: string | null }> | null;
        }>;
      };
    }>(
      auth,
      `query Estado($codigo: String!) {
        orders(options: { filter: { code: { eq: $codigo } }, take: 1 }) {
          items {
            code state orderPlacedAt totalWithTax currencyCode
            customer { emailAddress }
            lines { quantity productVariant { name } }
            fulfillments { state trackingCode }
          }
        }
      }`,
      { codigo },
      slug,
    );
    const pedido = data.orders.items[0];
    if (!pedido || pedido.customer?.emailAddress.toLowerCase() !== correo) {
      // La misma respuesta para "no existe" y "correo equivocado": no se
      // confirma a un tercero que un código de pedido es real.
      return NextResponse.json({ error: 'no-encontrado' }, { status: 404 });
    }
    return NextResponse.json({
      codigo: pedido.code,
      estado: pedido.state,
      fecha: pedido.orderPlacedAt,
      total: pedido.totalWithTax,
      moneda: pedido.currencyCode,
      lineas: pedido.lines.map(l => ({ nombre: l.productVariant.name, cantidad: l.quantity })),
      seguimiento: pedido.fulfillments?.map(f => f.trackingCode).filter(Boolean) ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'no-encontrado' }, { status: 404 });
  }
}
