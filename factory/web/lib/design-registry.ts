/**
 * Registro de unicidad de diseños: la huella (key) de cada diseño elegido
 * vive en el customField `design` del canal de su tienda. Nadie recibe una
 * propuesta cuya huella ya pertenezca a una tienda.
 */
import { adminLogin, adminRequest } from './vendure';

export async function takenDesignKeys(auth?: string): Promise<Set<string>> {
  const token = auth ?? (await adminLogin());
  const data = await adminRequest<{
    channels: { items: Array<{ customFields?: { design?: string | null } | null }> };
  }>(token, `{ channels(options: { take: 500 }) { items { customFields { design } } } }`);
  const keys = new Set<string>();
  for (const ch of data.channels.items) {
    if (!ch.customFields?.design) continue;
    try {
      const key = (JSON.parse(ch.customFields.design) as { key?: string }).key;
      if (key) keys.add(key);
    } catch {
      /* diseño ilegible: no bloquea nada */
    }
  }
  return keys;
}
