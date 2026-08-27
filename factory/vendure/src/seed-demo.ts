/**
 * Semilla de la Fase 0: datos iniciales (zonas, impuestos, envío, pago) y dos
 * tiendas demo, cada una como Channel de Vendure con catálogo y diseño propios.
 *
 * Uso: npm run seed:demo  (idempotente: si las tiendas ya existen, no hace nada)
 */
import {
    bootstrap,
    ChannelService,
    CurrencyCode,
    LanguageCode,
    ProductService,
    ProductVariantService,
    RequestContext,
    RequestContextService,
    SellerService,
    TaxCategoryService,
    ZoneService,
} from '@vendure/core';
import { populate } from '@vendure/core/cli';

import { DESIGN_PRESETS } from './designs';
import { config } from './vendure-config';

const initialData = {
    defaultLanguage: LanguageCode.en,
    defaultZone: 'Americas',
    countries: [
        { name: 'United States', code: 'US', zone: 'Americas' },
        { name: 'Cuba', code: 'CU', zone: 'Americas' },
        { name: 'Mexico', code: 'MX', zone: 'Americas' },
        { name: 'Spain', code: 'ES', zone: 'Europe' },
        { name: 'China', code: 'CN', zone: 'Asia' },
    ],
    taxRates: [{ name: 'Standard Tax', percentage: 0 }],
    shippingMethods: [{ name: 'Envío estándar', price: 500 }],
    paymentMethods: [
        {
            name: 'Pago demo',
            handler: {
                code: 'dummy-payment-handler',
                arguments: [{ name: 'automaticSettle', value: 'false' }],
            },
        },
    ],
    collections: [],
};

interface DemoProduct {
    name: string;
    slug: string;
    description: string;
    price: number; // centavos USD
}

interface DemoStore {
    code: string; // slug + token del canal + subdominio
    displayName: string;
    designKey: string;
    products: DemoProduct[];
}

const DEMO_STORES: DemoStore[] = [
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
    const app = await populate(() => bootstrap(config), initialData);
    try {
        const requestContextService = app.get(RequestContextService);
        const channelService = app.get(ChannelService);
        const sellerService = app.get(SellerService);
        const productService = app.get(ProductService);
        const productVariantService = app.get(ProductVariantService);
        const zoneService = app.get(ZoneService);
        const taxCategoryService = app.get(TaxCategoryService);

        const ctx: RequestContext = await requestContextService.create({ apiType: 'admin' });

        const existing = await channelService.findAll(ctx);
        const existingCodes = existing.items.map(c => c.code);
        const zonesResult: any = await zoneService.findAll(ctx);
        const zones: any[] = Array.isArray(zonesResult) ? zonesResult : zonesResult.items;
        const defaultZone = zones.find(z => z.name === 'Americas') ?? zones[0];
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
                defaultLanguageCode: LanguageCode.en,
                availableLanguageCodes: [LanguageCode.en],
                pricesIncludeTax: true,
                defaultCurrencyCode: CurrencyCode.USD,
                availableCurrencyCodes: [CurrencyCode.USD],
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
