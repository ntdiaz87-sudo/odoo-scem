/**
 * Registro de unicidad de diseños: la huella (key) de cada diseño elegido
 * vive en el customField `design` del canal de su tienda. Nadie recibe una
 * propuesta cuya huella ya pertenezca a una tienda.
 */
import { adminLogin, adminRequest } from './vendure';

const POR_PAGINA = 200;

/**
 * Se recorren TODOS los canales, por páginas.
 *
 * Esto leía `take: 500` de una vez. La promesa del producto es que ningún
 * diseño se repite, y con 500 huellas leídas y la 501 fuera, a partir de esa
 * tienda se habrían empezado a ofrecer diseños ya tomados sin que saltara
 * nada: no hay error, solo dos clientes con la misma cara. El tope no puede
 * ser un número escrito a mano.
 */
export async function takenDesignKeys(auth?: string): Promise<Set<string>> {
  const token = auth ?? (await adminLogin());
  const keys = new Set<string>();
  let leidos = 0;
  let total = Infinity;

  while (leidos < total) {
    const data = await adminRequest<{
      channels: { totalItems: number; items: Array<{ customFields?: { design?: string | null } | null }> };
    }>(
      token,
      `query Huellas($skip: Int!, $take: Int!) {
        channels(options: { skip: $skip, take: $take }) {
          totalItems
          items { customFields { design } }
        }
      }`,
      { skip: leidos, take: POR_PAGINA },
    );
    total = data.channels.totalItems;
    if (data.channels.items.length === 0) break; // sin esto, un total mal contado da vueltas para siempre
    leidos += data.channels.items.length;
    for (const ch of data.channels.items) {
      if (!ch.customFields?.design) continue;
      try {
        const key = (JSON.parse(ch.customFields.design) as { key?: string }).key;
        if (key) keys.add(key);
      } catch {
        /* diseño ilegible: no bloquea nada */
      }
    }
  }
  return keys;
}
