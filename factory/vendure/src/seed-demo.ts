/**
 * Semilla: datos iniciales (zonas, impuestos, envío, pago) y las tiendas de
 * muestra, cada una como Channel de Vendure con catálogo y diseño propios.
 *
 * Uso: npm run seed:demo  (idempotente: si las tiendas ya existen, no hace nada)
 *
 * TRADUCCIONES — por qué los textos chinos se guardan bajo `en`
 * -------------------------------------------------------------
 * El canal de cada tienda es zh_Hans (correcto: es lo que sirve la tienda),
 * pero el panel de Vendure guarda en SU idioma de interfaz, que por defecto
 * es inglés. Si los productos se crean en zh_Hans, el comerciante edita el
 * nombre en el panel, se escribe la traducción inglesa y la tienda sigue
 * mostrando la china: el cambio "no aparece".
 *
 * Guardando el texto (chino) bajo `en`, los dos caminos convergen:
 *   · panel en inglés  → actualiza `en`      → la tienda cae a `en`  ✓
 *   · panel en chino   → crea `zh_Hans`      → la tienda usa zh_Hans ✓
 * El código de idioma es interno; el comerciante nunca lo ve.
 */
import {
    bootstrap,
    ChannelService,
    CurrencyCode,
    GlobalSettingsService,
    LanguageCode,
    ProductService,
    ProductVariantService,
    RequestContext,
    RequestContextService,
    SellerService,
    TaxCategoryService,
    TransactionalConnection,
    ZoneService,
} from '@vendure/core';
import { populate } from '@vendure/core/cli';

import { DESIGN_PRESETS } from './designs';
import { config } from './vendure-config';

const initialData = {
    defaultLanguage: LanguageCode.zh_Hans,
    defaultZone: 'Asia',
    countries: [
        { name: '中国', code: 'CN', zone: 'Asia' },
        { name: '中国香港', code: 'HK', zone: 'Asia' },
        { name: '中国台湾', code: 'TW', zone: 'Asia' },
        { name: '中国澳门', code: 'MO', zone: 'Asia' },
        { name: 'United States', code: 'US', zone: 'Americas' },
        { name: 'Spain', code: 'ES', zone: 'Europe' },
    ],
    taxRates: [{ name: 'Standard Tax', percentage: 0 }],
    shippingMethods: [{ name: '标准快递', price: 1000 }],
    paymentMethods: [
        // Los tres métodos que espera un comprador chino. Los dos primeros
        // entran en modo API en cuanto haya credenciales de proveedor.
        {
            name: '微信支付',
            handler: { code: 'wechat-pay', arguments: [{ name: 'subMchId', value: '' }] },
        },
        {
            name: '支付宝',
            handler: { code: 'alipay', arguments: [{ name: 'subMchId', value: '' }] },
        },
        {
            name: '货到付款',
            handler: {
                code: 'dummy-payment-handler',
                arguments: [{ name: 'automaticSettle', value: 'false' }],
            },
        },
        {
            // 会员储值: solo elegible para clientes registrados con saldo
            // suficiente (ver src/saldo.ts). Liquida al instante.
            name: '会员储值',
            handler: { code: 'saldo-fabrica', arguments: [] },
            checker: { code: 'saldo-elegible', arguments: [] },
        },
    ],
    collections: [],
};

interface DemoProduct {
    name: string;
    slug: string;
    description: string;
    price: number; // en la unidad menor de la moneda del canal (分 / centavos)
}

interface DemoStore {
    code: string; // slug + token del canal + subdominio
    displayName: string;
    designKey: string;
    products: DemoProduct[];
}

// Tiendas de muestra del mercado de lanzamiento (China): nombres, catálogo y
// precios en yuan verosímiles, no una traducción del catálogo español.
const ZH = (process.env.SEED_LOCALE || 'zh') === 'zh';

const DEMO_STORES: DemoStore[] = ZH
    ? [
          {
              code: 'qingzhu',
              displayName: '青竹家居',
              designKey: 'hoja-viva',
              products: [
                  { name: '龟背竹', slug: 'guibeizhu', description: '好养的大叶绿植，放客厅很出效果。', price: 12800 },
                  { name: '琴叶榕', slug: 'qinyerong', description: '经典的室内小乔木，叶形好看。', price: 19800 },
                  { name: '陶土花盆 18cm', slug: 'huapen-18', description: '素烧陶盆，含托盘。', price: 4900 },
                  { name: '新手养护套装', slug: 'yanghu-taozhuang', description: '营养土、肥料和喷壶，一次配齐。', price: 7900 },
              ],
          },
          {
              code: 'noctachina',
              displayName: 'NOCTA 夜行',
              designKey: 'nocta',
              products: [
                  { name: '黑色宽版衬衫', slug: 'heise-chenshan', description: '宽松版型，厚棉，明线工艺。', price: 29900 },
                  { name: '石墨色工装裤', slug: 'gongzhuangku', description: '多口袋设计，裤脚可调。', price: 34900 },
                  { name: '金线针织帽', slug: 'zhenzhimao', description: '细针织，本店金线刺绣。', price: 12900 },
                  { name: '原色帆布袋', slug: 'fanbudai', description: '原色帆布，夜行系列印花。', price: 15900 },
              ],
          },
      ]
    : [
    {
        code: 'verdealto',
        displayName: 'Verdealto',
        designKey: 'hoja-viva',
        products: [
            { name: 'Monstera deliciosa', slug: 'monstera-deliciosa', description: 'Planta de interior de hojas grandes, fácil de cuidar.', price: 2400 },
            { name: 'Ficus lyrata', slug: 'ficus-lyrata', description: 'El clásico árbol de interior de hoja de violín.', price: 3200 },
            { name: 'Maceta Terra 18 cm', slug: 'maceta-terra-18', description: 'Maceta de barro cocido con plato incluido.', price: 900 },
            { name: 'Kit cuidado básico', slug: 'kit-cuidado-basico', description: 'Sustrato, abono y pulverizador para empezar bien.', price: 1400 },
        ],
    },
    {
        code: 'nocta',
        displayName: 'NOCTA',
        designKey: 'nocta',
        products: [
            { name: 'Camisa oversize negra', slug: 'camisa-oversize-negra', description: 'Corte amplio, algodón pesado, costuras vistas.', price: 4500 },
            { name: 'Pantalón cargo grafito', slug: 'pantalon-cargo-grafito', description: 'Bolsillos utilitarios y bajo ajustable.', price: 5200 },
            { name: 'Gorro dorado NOCTA', slug: 'gorro-dorado', description: 'Punto fino con bordado dorado de la casa.', price: 1800 },
            { name: 'Tote de lona', slug: 'tote-de-lona', description: 'Bolso de lona cruda con serigrafía nocturna.', price: 2200 },
        ],
    },
];

async function seed() {
    // La semilla levanta su propia instancia efímera en un puerto aparte para
    // no chocar con un servidor ya corriendo.
    const seedConfig = {
        ...config,
        apiOptions: { ...config.apiOptions, port: +(process.env.SEED_PORT || 3999) },
    };
    // populate() NO es idempotente (duplica métodos de envío/pago e impuestos
    // si se repite): solo se ejecuta si la base está vacía de zonas.
    let app = await bootstrap(seedConfig);
    {
        const requestContextService = app.get(RequestContextService);
        const zoneService = app.get(ZoneService);
        const ctx = await requestContextService.create({ apiType: 'admin' });
        const zonesResult: any = await zoneService.findAll(ctx);
        const zoneItems: any[] = Array.isArray(zonesResult) ? zonesResult : zonesResult.items;
        if (zoneItems.length === 0) {
            console.log('[seed] Base vacía: cargando datos iniciales…');
            await app.close();
            app = await populate(() => bootstrap(seedConfig), initialData);
        } else {
            console.log('[seed] Datos iniciales ya presentes, no se repite populate.');
        }
    }
    try {
        const requestContextService = app.get(RequestContextService);
        const channelService = app.get(ChannelService);
        const sellerService = app.get(SellerService);
        const productService = app.get(ProductService);
        const productVariantService = app.get(ProductVariantService);
        const zoneService = app.get(ZoneService);
        const taxCategoryService = app.get(TaxCategoryService);

        const ctx: RequestContext = await requestContextService.create({ apiType: 'admin' });

        // Idiomas disponibles: TODOS los mercados que ofrece la fábrica.
        //
        // Vendure no deja crear un canal en un idioma que no esté aquí: devuelve
        // «Language "es" is not available» como ErrorResult, no como excepción.
        // Costó encontrarlo porque quien creaba el canal se tragaba ese
        // ErrorResult y le decía al comerciante que el nombre estaba ocupado.
        // Si mañana se añade un mercado al diccionario, hay que añadirlo aquí:
        // si no, ese mercado se puede elegir en el asistente y ninguna tienda
        // llega a crearse.
        //
        // El inglés, además, no se puede quitar aunque no fuese un mercado: el
        // panel de Vendure envía su propio idioma al guardar, y sin él guardar
        // un producto falla. Ver la nota de TRADUCCIONES abajo.
        const globalSettingsService = app.get(GlobalSettingsService);
        await globalSettingsService.updateSettings(ctx, {
            availableLanguages: [LanguageCode.zh_Hans, LanguageCode.es, LanguageCode.en],
        });
        console.log('[seed] Idiomas habilitados: zh_Hans, es, en');

        const existing = await channelService.findAll(ctx);
        const existingCodes = existing.items.map(c => c.code);
        const zonesResult: any = await zoneService.findAll(ctx);
        const zones: any[] = Array.isArray(zonesResult) ? zonesResult : zonesResult.items;
        const defaultZone = zones.find(z => z.name === (ZH ? 'Asia' : 'Americas')) ?? zones[0];
        if (!defaultZone) {
            throw new Error('No hay zonas creadas; la población inicial falló.');
        }
        const taxCatsResult: any = await taxCategoryService.findAll(ctx);
        const taxCats: any[] = Array.isArray(taxCatsResult) ? taxCatsResult : taxCatsResult.items;
        const taxCategoryId = taxCats[0]?.id;

        for (const store of DEMO_STORES) {
            if (existingCodes.includes(store.code)) {
                console.log(`[seed] La tienda "${store.code}" ya existe, se omite.`);
                continue;
            }
            const design = DESIGN_PRESETS.find(d => d.key === store.designKey)!;
            const seller = await sellerService.create(ctx, { name: store.displayName });
            const channelResult: any = await channelService.create(ctx, {
                code: store.code,
                token: store.code,
                defaultLanguageCode: ZH ? LanguageCode.zh_Hans : LanguageCode.en,
                availableLanguageCodes: [ZH ? LanguageCode.zh_Hans : LanguageCode.en],
                pricesIncludeTax: true,
                defaultCurrencyCode: ZH ? CurrencyCode.CNY : CurrencyCode.USD,
                availableCurrencyCodes: [ZH ? CurrencyCode.CNY : CurrencyCode.USD],
                defaultTaxZoneId: defaultZone.id,
                defaultShippingZoneId: defaultZone.id,
                sellerId: seller.id,
                customFields: {
                    displayName: store.displayName,
                    design: JSON.stringify(design),
                    isSandbox: false,
                },
            } as any);
            if (!channelResult || !channelResult.id) {
                throw new Error(`No se pudo crear el canal ${store.code}: ${JSON.stringify(channelResult)}`);
            }
            console.log(`[seed] Canal creado: ${store.code} (id ${channelResult.id})`);

            const channelCtx: RequestContext = await requestContextService.create({
                apiType: 'admin',
                channelOrToken: channelResult,
            });
            for (const p of store.products) {
                const product = await productService.create(channelCtx, {
                    enabled: true,
                    translations: [
                        {
                            // Ver nota TRADUCCIONES en la cabecera de este fichero.
                            languageCode: LanguageCode.en,
                            name: p.name,
                            slug: p.slug,
                            description: p.description,
                        },
                    ],
                });
                await productVariantService.create(channelCtx, [
                    {
                        productId: product.id,
                        sku: `${store.code}-${p.slug}`,
                        price: p.price,
                        taxCategoryId,
                        stockOnHand: 25,
                        translations: [{ languageCode: LanguageCode.en, name: p.name }],
                    } as any,
                ]);
            }
            console.log(`[seed] ${store.products.length} productos creados en ${store.code}.`);
        }

        // Reparación idempotente: el rol de superadmin debe estar asignado a
        // TODOS los canales (la creación programática de canales no lo hace
        // sola, y sin esto no se pueden crear roles de dueño por tienda).
        const connection = app.get(TransactionalConnection);
        await connection.rawConnection.query(`
            INSERT INTO role_channels_channel ("roleId", "channelId")
            SELECT r.id, c.id FROM role r CROSS JOIN channel c
            WHERE r.code = '__super_admin_role__'
              AND NOT EXISTS (
                SELECT 1 FROM role_channels_channel rc
                WHERE rc."roleId" = r.id AND rc."channelId" = c.id
              );
        `);
        console.log('[seed] Rol superadmin asignado a todos los canales.');

        // Reparación de duplicados históricos (populate corrió más de una vez
        // en despliegues previos): se conserva el método más antiguo por código.
        await connection.rawConnection.query(`
            UPDATE shipping_method SET "deletedAt" = now()
            WHERE "deletedAt" IS NULL AND id NOT IN (
                SELECT min(id) FROM shipping_method WHERE "deletedAt" IS NULL GROUP BY code
            );
        `);
        await connection.rawConnection.query(`
            UPDATE payment_method SET enabled = false
            WHERE id NOT IN (SELECT min(id) FROM payment_method GROUP BY code);
        `);

        // 会员储值 como método de pago. populate() solo corre en bases nuevas,
        // así que en una base ya sembrada (la de producción) el método no
        // existiría nunca. Se crea aquí, idempotente, y el bloque siguiente lo
        // reparte a todos los canales.
        await connection.rawConnection.query(`
            INSERT INTO payment_method (code, enabled, "handler", "checker", "createdAt", "updatedAt")
            SELECT 'saldo-fabrica', true,
                   '{"code":"saldo-fabrica","args":[]}',
                   '{"code":"saldo-elegible","args":[]}',
                   now(), now()
            WHERE NOT EXISTS (SELECT 1 FROM payment_method WHERE code = 'saldo-fabrica');
        `);
        await connection.rawConnection.query(`
            INSERT INTO payment_method_translation ("languageCode", name, description, "baseId", "createdAt", "updatedAt")
            SELECT 'en', '会员储值', '', p.id, now(), now()
            FROM payment_method p
            WHERE p.code = 'saldo-fabrica'
              AND NOT EXISTS (
                SELECT 1 FROM payment_method_translation t WHERE t."baseId" = p.id
              );
        `);

        // Todos los canales deben poder vender: método de envío y de pago
        // asignados a cada canal (idempotente; cubre también los canales que
        // ya existían sin métodos).
        await connection.rawConnection.query(`
            INSERT INTO shipping_method_channels_channel ("shippingMethodId", "channelId")
            SELECT s.id, c.id FROM shipping_method s CROSS JOIN channel c
            WHERE s."deletedAt" IS NULL
              AND NOT EXISTS (
                SELECT 1 FROM shipping_method_channels_channel x
                WHERE x."shippingMethodId" = s.id AND x."channelId" = c.id
              );
        `);
        await connection.rawConnection.query(`
            INSERT INTO payment_method_channels_channel ("paymentMethodId", "channelId")
            SELECT p.id, c.id FROM payment_method p CROSS JOIN channel c
            WHERE p.enabled
              AND NOT EXISTS (
                SELECT 1 FROM payment_method_channels_channel x
                WHERE x."paymentMethodId" = p.id AND x."channelId" = c.id
              );
        `);
        // Sin almacén asignado al canal, el stock vendible es 0 y el carrito
        // rechaza los productos (InsufficientStockError).
        await connection.rawConnection.query(`
            INSERT INTO stock_location_channels_channel ("stockLocationId", "channelId")
            SELECT s.id, c.id FROM stock_location s CROSS JOIN channel c
            WHERE NOT EXISTS (
                SELECT 1 FROM stock_location_channels_channel x
                WHERE x."stockLocationId" = s.id AND x."channelId" = c.id
            );
        `);
        console.log('[seed] Métodos de envío/pago y almacén asignados a todos los canales.');
        console.log('[seed] Semilla completada.');
    } finally {
        await app.close();
    }
}

seed().then(
    () => process.exit(0),
    err => {
        console.error(err);
        process.exit(1);
    },
);
