/**
 * 会员储值 como método de pago (Fase 6, lado comprador).
 *
 * El saldo lo recarga el COMERCIANTE en su panel cuando recibe el prepago.
 * Gastar el saldo exige CUENTA: el método solo es elegible si el pedido es
 * de un cliente registrado y con la sesión iniciada, y el cobro descuenta
 * con una sola sentencia condicionada (`saldo >= importe`) para que dos
 * pedidos a la vez no puedan gastar el mismo yuan. Un invitado que teclee
 * el correo de otro no ve el método ni puede usarlo.
 */
import {
  Injector,
  LanguageCode,
  PaymentMethodEligibilityChecker,
  PaymentMethodHandler,
  TransactionalConnection,
} from '@vendure/core';

let conexion: TransactionalConnection;

interface FilaSaldo {
  cid: number;
  saldo: number;
  movs: string | null;
  uid: number | null;
}

async function filaDelPedido(orderId: unknown): Promise<FilaSaldo | null> {
  const filas = (await conexion.rawConnection.query(
    `SELECT c.id AS cid, c."customFieldsSaldo" AS saldo, c."customFieldsSaldomovs" AS movs, c."userId" AS uid
     FROM "order" o JOIN customer c ON c.id = o."customerId"
     WHERE o.id = $1`,
    [orderId],
  )) as FilaSaldo[];
  return filas[0] ?? null;
}

export const saldoElegibilidad = new PaymentMethodEligibilityChecker({
  code: 'saldo-elegible',
  description: [
    { languageCode: LanguageCode.en, value: 'Registered customer with enough prepaid balance' },
  ],
  args: {},
  init(injector: Injector) {
    conexion = injector.get(TransactionalConnection);
  },
  async check(ctx, order) {
    const fila = await filaDelPedido(order.id);
    if (!fila || fila.uid == null) return false; // invitado: sin cuenta no hay saldo
    if (ctx.activeUserId == null || String(ctx.activeUserId) !== String(fila.uid)) return false;
    return fila.saldo >= order.totalWithTax;
  },
});

export const saldoHandler = new PaymentMethodHandler({
  code: 'saldo-fabrica',
  description: [
    { languageCode: LanguageCode.en, value: 'Prepaid balance (会员储值)' },
  ],
  args: {},
  init(injector: Injector) {
    conexion = injector.get(TransactionalConnection);
  },
  async createPayment(ctx, order, amount, _args, _metadata) {
    const fila = await filaDelPedido(order.id);
    if (!fila || fila.uid == null || ctx.activeUserId == null || String(ctx.activeUserId) !== String(fila.uid)) {
      return { amount, state: 'Declined' as const, errorMessage: '需要登录账户才能使用储值余额' };
    }
    let movs: Array<{ fecha: string; delta: number; nota: string }> = [];
    try {
      movs = fila.movs ? JSON.parse(fila.movs) : [];
    } catch {
      movs = [];
    }
    movs = [{ fecha: new Date().toISOString(), delta: -amount, nota: `订单 ${order.code}` }, ...movs].slice(0, 100);
    // La condición saldo >= importe va EN el UPDATE: si dos pedidos corren a
    // la vez, solo uno resta; el otro cae aquí y queda rechazado.
    const resultado = (await conexion.rawConnection.query(
      `UPDATE customer SET "customFieldsSaldo" = "customFieldsSaldo" - $1, "customFieldsSaldomovs" = $2
       WHERE id = $3 AND "customFieldsSaldo" >= $1`,
      [amount, JSON.stringify(movs), fila.cid],
    )) as [unknown, number];
    const tocadas = Array.isArray(resultado) ? resultado[1] : 0;
    if (!tocadas) {
      return { amount, state: 'Declined' as const, errorMessage: '储值余额不足' };
    }
    return { amount, state: 'Settled' as const, transactionId: `saldo-${order.code}` };
  },
  settlePayment() {
    return { success: true };
  },
});
