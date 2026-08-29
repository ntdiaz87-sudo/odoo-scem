/** Tema del visitante, resuelto en el servidor para que no haya parpadeo. */
import { cookies } from 'next/headers';
import { COOKIE_TEMA, type Tema } from './tema';

/** null = sin preferencia guardada: manda la del sistema operativo. */
export async function getTema(): Promise<Tema | null> {
  const v = (await cookies()).get(COOKIE_TEMA)?.value;
  return v === 'light' || v === 'dark' ? v : null;
}
