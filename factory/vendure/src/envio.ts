/**
 * Calculadora de envío de la fábrica: la que configura cada comerciante.
 *
 * Dos números y ya: la tarifa, y a partir de cuánto el envío es gratis. Son
 * las dos únicas reglas que un comercio pequeño usa de verdad; las zonas por
 * peso y por región llegarán cuando alguien las pida, no antes.
 *
 * Cada tienda tiene SU método de envío (código envio-<slug>) con sus args, así
 * que el comerciante cambia su tarifa sin tocar la de nadie. El método
 * compartido 标准快递 de la semilla queda como respaldo para las tiendas que
 * aún no configuraron nada.
 */
import { LanguageCode, ShippingCalculator } from '@vendure/core';

export const envioFabrica = new ShippingCalculator({
    code: 'envio-fabrica',
    description: [{ languageCode: LanguageCode.en, value: 'Tarifa de la tienda con envío gratis desde un importe' }],
    args: {
        tarifa: {
            type: 'int',
            ui: { component: 'currency-form-input' },
            label: [{ languageCode: LanguageCode.en, value: 'Tarifa (céntimos)' }],
        },
        gratisDesde: {
            type: 'int',
            ui: { component: 'currency-form-input' },
            label: [{ languageCode: LanguageCode.en, value: 'Gratis a partir de (céntimos; 0 = nunca)' }],
        },
    },
    calculate: (ctx, order, args) => {
        const gratis = args.gratisDesde > 0 && order.subTotalWithTax >= args.gratisDesde;
        return {
            price: gratis ? 0 : args.tarifa,
            priceIncludesTax: true,
            taxRate: 0,
            metadata: { gratis },
        };
    },
});
