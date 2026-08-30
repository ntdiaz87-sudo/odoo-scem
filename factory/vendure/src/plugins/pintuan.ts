/**
 * 拼团 (compra en grupo) — la mecánica viral del comercio chino.
 *
 * Modelo, con pago manual (Fase 1 aún sin credenciales):
 *  - El comerciante activa el 拼团 POR PRODUCTO: cuánta gente, qué rebaja
 *    y cuántas horas dura la ventana (customFields del producto).
 *  - Un comprador ABRE un grupo (iniciarGrupo) y comparte su enlace; los
 *    demás se UNEN por el enlace. Todos compran al precio de grupo: la
 *    promoción del canal aplica la rebaja a los pedidos que llevan el
 *    código del grupo.
 *  - El pago queda AUTORIZADO, como todo en la fábrica hoy. El comerciante
 *    solo liquida cuando el grupo está COMPLETO; si caduca incompleto,
 *    cancela pedidos que nunca cobró. El dinero no se mueve hasta el 成团,
 *    que es exactamente la promesa del 拼团.
 */
import {
  Ctx,
  ID,
  LanguageCode,
  PluginCommonModule,
  ProductService,
  PromotionCondition,
  PromotionItemAction,
  RequestContext,
  TransactionalConnection,
  VendureEntity,
  VendurePlugin,
} from '@vendure/core';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Column, Entity } from 'typeorm';
import type { DeepPartial } from '@vendure/common/lib/shared-types';
import gql from 'graphql-tag';

/* --------------------------------- entidad -------------------------------- */

@Entity()
export class Grupo extends VendureEntity {
  constructor(input?: DeepPartial<Grupo>) {
    super(input);
  }

  @Column({ unique: true })
  codigo: string;

  @Column()
  channelToken: string;

  @Column()
  productId: string;

  @Column('int')
  tamano: number;

  @Column('int')
  pct: number;

  @Column()
  expiraEn: Date;
}

/* ------------------------- estado de un grupo ----------------------------- */

/** Pedidos que cuentan para el grupo: los que llegaron a comprometerse. */
const ESTADOS_QUE_CUENTAN = ['PaymentAuthorized', 'PaymentSettled', 'Shipped', 'Delivered'];

async function contarUnidos(connection: TransactionalConnection, codigo: string): Promise<number> {
  const filas = (await connection.rawConnection.query(
    `SELECT count(*)::int AS n FROM "order" WHERE "customFieldsGrupo" = $1 AND state = ANY($2)`,
    [codigo, ESTADOS_QUE_CUENTAN],
  )) as Array<{ n: number }>;
  return filas[0]?.n ?? 0;
}

function estadoDe(grupo: Grupo, unidos: number): 'abierto' | 'completo' | 'caducado' {
  if (unidos >= grupo.tamano) return 'completo';
  if (grupo.expiraEn.getTime() < Date.now()) return 'caducado';
  return 'abierto';
}

/* ------------------- condición y acción de la promoción ------------------- */

let conexionPromo: TransactionalConnection;

/**
 * Condición: el pedido lleva un código de grupo vivo (no caducado). La
 * caducidad corta la rebaja para quien llega tarde; a quien YA compró no le
 * cambia el pedido: su precio quedó fijado al confirmar.
 */
export const condicionPintuan = new PromotionCondition({
  code: 'grupo-pintuan',
  description: [
    { languageCode: LanguageCode.en, value: 'Order belongs to an active 拼团 group' },
  ],
  args: {},
  init(injector) {
    conexionPromo = injector.get(TransactionalConnection);
  },
  async check(ctx, order) {
    const codigo = (order.customFields as { grupo?: string | null }).grupo;
    if (!codigo) return false;
    const grupo = await conexionPromo.rawConnection.getRepository(Grupo).findOne({ where: { codigo } });
    if (!grupo || grupo.channelToken !== ctx.channel.token) return false;
    if (grupo.expiraEn.getTime() <= Date.now()) return false;
    // Lo que devuelve la condición viaja a la acción como "state": así la
    // acción no repite la consulta en cada línea.
    return { productId: grupo.productId, pct: grupo.pct };
  },
});

/**
 * Acción: rebaja el % del grupo SOLO en las líneas del producto del grupo.
 * El % vive en el grupo (copiado del producto al abrirlo), así que cambiar
 * la configuración del producto no mueve los grupos ya abiertos.
 */
export const accionPintuan = new PromotionItemAction({
  code: 'descuento-pintuan',
  description: [
    { languageCode: LanguageCode.en, value: 'Apply the 拼团 group discount to its product' },
  ],
  args: {},
  conditions: [condicionPintuan],
  execute(ctx, orderLine, _args, state) {
    const grupo = state['grupo-pintuan'] as { productId: string; pct: number } | undefined;
    if (!grupo || String(orderLine.productVariant.productId) !== grupo.productId) return 0;
    return -Math.round((orderLine.unitPriceWithTax * grupo.pct) / 100);
  },
});

/* ----------------------------- API de la tienda --------------------------- */

const schemaShop = gql`
  type GrupoPintuan {
    codigo: String!
    productId: ID!
    tamano: Int!
    unidos: Int!
    pct: Int!
    expiraEn: DateTime!
    estado: String!
  }
  extend type Query {
    grupo(codigo: String!): GrupoPintuan
  }
  extend type Mutation {
    iniciarGrupo(productId: ID!): GrupoPintuan
  }
`;

@Resolver()
export class PintuanShopResolver {
  constructor(
    private connection: TransactionalConnection,
    private productService: ProductService,
  ) {}

  @Query()
  async grupo(@Ctx() ctx: RequestContext, @Args() args: { codigo: string }) {
    const grupo = await this.connection
      .getRepository(ctx, Grupo)
      .findOne({ where: { codigo: args.codigo } });
    if (!grupo || grupo.channelToken !== ctx.channel.token) return null;
    const unidos = await contarUnidos(this.connection, grupo.codigo);
    return { ...grupo, unidos, estado: estadoDe(grupo, unidos) };
  }

  @Mutation()
  async iniciarGrupo(@Ctx() ctx: RequestContext, @Args() args: { productId: ID }) {
    const producto = await this.productService.findOne(ctx, args.productId);
    if (!producto) throw new Error('producto no encontrado');
    const cf = producto.customFields as { ptTamano?: number; ptPct?: number; ptHoras?: number };
    const tamano = cf.ptTamano ?? 0;
    const pct = cf.ptPct ?? 0;
    const horas = cf.ptHoras && cf.ptHoras > 0 ? cf.ptHoras : 24;
    if (tamano < 2 || pct <= 0) throw new Error('este producto no tiene 拼团');
    const grupo = await this.connection.getRepository(ctx, Grupo).save(
      new Grupo({
        codigo: `g${Math.random().toString(36).slice(2, 10)}`,
        channelToken: ctx.channel.token,
        productId: String(args.productId),
        tamano,
        pct,
        expiraEn: new Date(Date.now() + horas * 60 * 60 * 1000),
      }),
    );
    return { ...grupo, unidos: 0, estado: 'abierto' as const };
  }
}

/* --------------------------------- plugin --------------------------------- */

@VendurePlugin({
  imports: [PluginCommonModule],
  entities: [Grupo],
  shopApiExtensions: {
    schema: schemaShop,
    resolvers: [PintuanShopResolver],
  },
  configuration: config => {
    config.customFields.Product.push(
      // 拼团 por producto: 0 personas = apagado.
      { name: 'ptTamano', type: 'int', defaultValue: 0 },
      { name: 'ptPct', type: 'int', defaultValue: 0 },
      { name: 'ptHoras', type: 'int', defaultValue: 24 },
    );
    config.customFields.Order.push(
      // El código del grupo al que pertenece este pedido.
      { name: 'grupo', type: 'string', nullable: true },
    );
    config.promotionOptions.promotionConditions = [
      ...(config.promotionOptions.promotionConditions ?? []),
      condicionPintuan,
    ];
    config.promotionOptions.promotionActions = [
      ...(config.promotionOptions.promotionActions ?? []),
      accionPintuan,
    ];
    return config;
  },
  compatibility: '^3.0.0',
})
export class PintuanPlugin {}
