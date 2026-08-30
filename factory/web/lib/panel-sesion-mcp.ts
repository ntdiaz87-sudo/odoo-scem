/**
 * La sesión del comerciante a partir de credenciales, sin cookie.
 *
 * El back office la saca de su cookie; el MCP, de un HTTP Basic. La sesión
 * que devuelven las dos es LA MISMA (SesionPanel), y por eso el agente y el
 * panel ven exactamente los mismos datos: si el agente hablase por su
 * cuenta con Vendure, acabarían contando cosas distintas al comerciante.
 */
import { DESIGN_PRESETS } from './designs';
import { MONEDA_DE } from './i18n';
import type { SesionPanel } from './panel-sesion';
import { loadStoreInfo } from './store-design';
import { ownerLogin, ownerMe } from './vendure';

export async function sesionPorCredenciales(
  correo: string,
  clave: string,
): Promise<SesionPanel | null> {
  const token = await ownerLogin(correo, clave);
  if (!token) return null;
  const yo = await ownerMe(token);
  if (!yo || yo.canales.length === 0) return null;
  const canal = yo.canales[0];
  const info = await loadStoreInfo(canal.token);
  return {
    token,
    correo: yo.identifier,
    canal,
    nombre: info?.name || canal.code,
    design: info?.design ?? DESIGN_PRESETS[0],
    mercado: info?.mercado ?? 'zh',
    moneda: info?.moneda ?? MONEDA_DE[info?.mercado ?? 'zh'],
    promesas: info?.promesas ?? { entregaPlazo: '', entregaNota: '', pagoFormas: '', atencionNota: '' },
  };
}
