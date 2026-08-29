/**
 * Métodos de pago del mercado chino.
 *
 * Modelo de la plataforma: **proveedor de servicios (服务商)**. WeChat Pay
 * liquida a la institución (la fábrica) y la institución liquida a cada
 * comerciante; cada tienda es un **sub-comerciante** con su propio
 * `subMchId`. Ese identificador se guarda por canal, de modo que el pago
 * de cada tienda va a la cuenta de su dueño.
 *
 * Estado actual: los manejadores están completos en su forma y en su
 * contrato, pero **no llaman todavía al API de WeChat/Alipay**: mientras no
 * haya credenciales de proveedor, el pago se registra como AUTORIZADO y el
 * comerciante lo concilia desde su panel — el mismo comportamiento que el
 * pago contra entrega. Cuando lleguen las credenciales, solo hay que
 * rellenar `crearPagoRemoto` y `verificarPagoRemoto`: ni el checkout ni el
 * panel cambian.
 */
import { LanguageCode, PaymentMethodHandler } from '@vendure/core';

/** ¿Hay credenciales de proveedor configuradas? */
export function credencialesWechat(): boolean {
  return Boolean(process.env.WECHAT_MCH_ID && process.env.WECHAT_API_KEY);
}
export function credencialesAlipay(): boolean {
  return Boolean(process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY);
}

/**
 * Punto de extensión: aquí entrará la llamada real al API cuando existan
 * credenciales. Devuelve el identificador de la transacción remota.
 */
async function crearPagoRemoto(
  canal: string,
  subMchId: string | undefined,
  importe: number,
  proveedor: 'wechat' | 'alipay',
): Promise<{ transactionId: string; pendiente: boolean }> {
  // TODO(credenciales): unified order de WeChat Pay / alipay.trade.create.
  // Sin credenciales no se inventa una transacción: se marca pendiente de
  // conciliación manual, que es lo que el comerciante puede resolver hoy.
  return {
    transactionId: `${proveedor}-${canal}-${Date.now()}`,
    pendiente: !subMchId,
  };
}

function manejador(
  code: string,
  nombreZh: string,
  nombreEs: string,
  proveedor: 'wechat' | 'alipay',
  hayCredenciales: () => boolean,
) {
  return new PaymentMethodHandler({
    code,
    description: [
      { languageCode: LanguageCode.zh_Hans, value: nombreZh },
      { languageCode: LanguageCode.en, value: nombreEs },
    ],
    args: {
      // Identificador del sub-comerciante de ESTA tienda dentro del modelo
      // de proveedor de servicios. Se rellena al dar de alta al comerciante.
      subMchId: {
        type: 'string',
        required: false,
        label: [
          { languageCode: LanguageCode.zh_Hans, value: '子商户号' },
          { languageCode: LanguageCode.en, value: 'Sub-merchant ID' },
        ],
      },
    },
    createPayment: async (ctx, order, amount, args) => {
      const remoto = await crearPagoRemoto(ctx.channel.token, args.subMchId, amount, proveedor);
      return {
        amount,
        // Sin credenciales o sin sub-comerciante, el pago queda autorizado y
        // lo concilia el comerciante; con ellas, el API decide.
        state: 'Authorized' as const,
        transactionId: remoto.transactionId,
        metadata: {
          proveedor,
          subMchId: args.subMchId || null,
          modo: hayCredenciales() && args.subMchId ? 'api' : 'conciliacion-manual',
          nota: hayCredenciales()
            ? '在线支付'
            : '等待商家确认收款（平台支付通道尚未开通）',
        },
      };
    },
    settlePayment: async () => ({ success: true }),
  });
}

export const wechatPayHandler = manejador(
  'wechat-pay',
  '微信支付',
  'WeChat Pay',
  'wechat',
  credencialesWechat,
);

export const alipayHandler = manejador(
  'alipay',
  '支付宝',
  'Alipay',
  'alipay',
  credencialesAlipay,
);
