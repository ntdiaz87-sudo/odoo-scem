import {
    defaultShippingCalculator,
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    DefaultStockLocationStrategy,
    VendureConfig,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import 'dotenv/config';
import { alipayHandler, wechatPayHandler } from './payments-cn';
import { envioFabrica } from './envio';
import path from 'path';

const IS_DEV = process.env.APP_ENV === 'dev';
// PORT wins because hosting platforms inject it into the environment at runtime, and that
// must take precedence over any value baked into the .env file at scaffold time.
const serverPort = +process.env.PORT || +process.env.VENDURE_SERVER_PORT || 3000;

export const config: VendureConfig = {
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        trustProxy: IS_DEV ? false : 1,
        // The following options are useful in development mode,
        // but are best turned off for production for security
        // reasons.
        ...(IS_DEV ? {
            adminApiDebug: true,
            shopApiDebug: true,
        } : {}),
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME,
            password: process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
          secret: process.env.COOKIE_SECRET,
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        // Fase 0: el esquema se sincroniza automáticamente. Antes de producción
        // real se pasará a migraciones (ver README "Migrations").
        synchronize: true,
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        host: process.env.DB_HOST || 'localhost',
        port: +(process.env.DB_PORT || 5432),
        username: process.env.DB_USERNAME || 'vendure',
        password: process.env.DB_PASSWORD || 'vendure',
        database: process.env.DB_NAME || 'vendure',
    },
    paymentOptions: {
        // dummyPaymentHandler cubre el pago contra entrega / acordado con la
        // tienda; los dos chinos entran en cuanto haya credenciales (ver
        // payments-cn.ts).
        paymentMethodHandlers: [dummyPaymentHandler, wechatPayHandler, alipayHandler],
    },
    shippingOptions: {
        // defaultShippingCalculator se conserva: el método compartido de la
        // semilla lo usa. envioFabrica es el de cada tienda (ver envio.ts).
        shippingCalculators: [defaultShippingCalculator, envioFabrica],
    },
    catalogOptions: {
        // La estrategia multicanal por defecto cachea 7 días qué canales ven
        // cada almacén y NO se invalida al asignar el almacén a un canal nuevo:
        // las tiendas recién creadas verían stock 0 (InsufficientStockError).
        // Aquí cada variante pertenece a un solo canal, así que la estrategia
        // simple es correcta y no sufre ese caché.
        stockLocationStrategy: new DefaultStockLocationStrategy(),
    },
    // When adding or altering custom field definitions, the database will
    // need to be updated. See the "Migrations" section in README.md.
    customFields: {
        Channel: [
            // Nombre visible de la tienda (el code/token del canal es el slug).
            { name: 'displayName', type: 'string', nullable: true },
            // Tokens de diseño de la tienda (JSON): paleta, tipografías, forma.
            { name: 'design', type: 'text', nullable: true },
            // Tienda de prueba (demo sandbox) vs. tienda real.
            { name: 'isSandbox', type: 'boolean', defaultValue: false },
            // Caducidad del sandbox (14 días desde su creación).
            { name: 'expiresAt', type: 'datetime', nullable: true },
            // Mercado de la tienda: 'zh' | 'es' | 'en'. Lo elige el comerciante
            // al crearla y decide en qué idioma y moneda ve la tienda SU
            // cliente. El canal ya lleva defaultLanguageCode y
            // defaultCurrencyCode, pero esos son códigos de Vendure; este es el
            // mercado tal y como lo entiende la fábrica, y es el que lee el
            // escaparate para traducirse.
            { name: 'mercado', type: 'string', nullable: true },
            // Lo que el comerciante promete a sus clientes. Vacío = no se
            // enseña: la tienda no inventa plazos ni formas de pago por él.
            { name: 'entregaPlazo', type: 'string', nullable: true },
            { name: 'entregaNota', type: 'string', nullable: true },
            { name: 'pagoFormas', type: 'string', nullable: true },
            { name: 'atencionNota', type: 'string', nullable: true },
        ],
    },
    plugins: [
        GraphiqlPlugin.init(),
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            // En el servidor, los assets se sirven detrás del Caddy del host:
            // ASSET_URL_PREFIX=https://<dominio>/assets/ (ver factory/infra).
            assetUrlPrefix: process.env.ASSET_URL_PREFIX || undefined,
        }),
        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            devMode: true,
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            route: 'mailbox',
            handlers: defaultEmailHandlers,
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../static/email/templates')),
            globalTemplateVars: {
                // The following variables will change depending on your storefront implementation.
                // Here we are assuming a storefront running at http://localhost:8080.
                fromAddress: '"example" <noreply@example.com>',
                verifyEmailAddressUrl: 'http://localhost:8080/verify',
                passwordResetUrl: 'http://localhost:8080/password-reset',
                changeEmailAddressUrl: 'http://localhost:8080/verify-email-address-change'
            },
        }),
        DashboardPlugin.init({
            route: 'dashboard',
            appDir: IS_DEV
                ? path.join(__dirname, '../dist/dashboard')
                : path.join(__dirname, 'dashboard'),
        }),
    ],
};
