/** Traduce el estado interno de Vendure a algo que un comerciante entienda. */
export function etiquetaEstado(estado: string, t: (k: string) => string): { txt: string; clase: string } {
  if (estado === 'PaymentAuthorized') return { txt: t('pn.pe.pendientecobro'), clase: 'is-aviso' };
  if (estado === 'PaymentSettled') return { txt: t('pn.porenviar'), clase: 'is-aviso' };
  if (estado === 'Shipped') return { txt: t('pn.pe.enviado'), clase: 'is-on' };
  if (estado === 'Delivered') return { txt: t('pn.pe.hecho'), clase: 'is-on' };
  if (estado === 'Cancelled') return { txt: estado, clase: '' };
  return { txt: estado, clase: '' };
}
