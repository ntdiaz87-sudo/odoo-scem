/**
 * Idiomas de la plataforma.
 *
 * Hay DOS idiomas en juego y no son lo mismo:
 *
 *  · **El idioma del mercado** (`LOCALE`): se fija en build con
 *    NEXT_PUBLIC_LOCALE. Define la moneda, el idioma de los canales que se
 *    crean y el de las TIENDAS de los comerciantes. Una tienda china se
 *    sirve en chino aunque el visitante tenga la fábrica en español: esa
 *    tienda es de su dueño y de su mercado.
 *
 *  · **El idioma del visitante**: solo afecta a las páginas de la propia
 *    fábrica (home, asistente, panel de canales). Se resuelve por petición
 *    desde una cookie, con el idioma del navegador como respaldo — ver
 *    i18n-server.ts (servidor) y app/locale-provider.tsx (cliente).
 *
 * El chino NO es una traducción del español: es el idioma en el que se
 * escribió esta versión del producto.
 */
export type Locale = 'zh' | 'es';

export const LOCALES: Locale[] = ['zh', 'es'];
export const NOMBRE_IDIOMA: Record<Locale, string> = { zh: '中文', es: 'Español' };

/** Idioma del mercado de lanzamiento (build). */
export const LOCALE: Locale =
  (process.env.NEXT_PUBLIC_LOCALE as Locale) === 'es' ? 'es' : 'zh';

export function esLocaleValido(v: string | undefined | null): v is Locale {
  return v === 'zh' || v === 'es';
}

/** Moneda del mercado: yuan en China, dólar fuera. */
export const CURRENCY = LOCALE === 'zh' ? 'CNY' : 'USD';
export const CURRENCY_SYMBOL = LOCALE === 'zh' ? '¥' : 'US$';

/** Etiqueta de idioma para <html lang>. */
export const HTML_LANG = LOCALE === 'zh' ? 'zh-CN' : 'es';

type Dict = Record<string, { zh: string; es: string }>;

const D: Dict = {
  /* ---- marca y navegación ---- */
  'marca.tagline': { zh: '你的 AI 商店工厂', es: 'Tu fábrica de tiendas con IA' },
  'nav.como': { zh: '怎么用', es: 'Cómo funciona' },
  'nav.disenos': { zh: '专属设计', es: 'Diseños únicos' },
  'nav.canales': { zh: '销售渠道', es: 'Canales' },
  'nav.planes': { zh: '价格', es: 'Planes' },
  'nav.cta': { zh: '免费试用', es: 'Probar demo gratis' },
  'volver': { zh: '返回', es: 'Volver' },

  /* ---- home ---- */
  'home.eyebrow': { zh: '你的生意 · 你的品牌 · 你的商店', es: 'Tu negocio, tu marca, tu tienda' },
  'home.h1.l1': { zh: '一句话，', es: 'Tu tienda online,' },
  'home.h1.l2': { zh: '生成你的完整商店。', es: 'creada por IA.' },
  'home.h1.l3': { zh: '独一无二。', es: 'Ninguna otra igual.' },
  'home.sub': {
    zh: '告诉我们你卖什么，AI 为你生成网店、H5 和微信小程序，配上专属设计和一支 AI 团队来运营。',
    es: 'Responde unas preguntas y nuestra IA diseña una tienda única para tu negocio. Web, app, dominio, pagos y agentes de IA. Todo listo para vender.',
  },
  'home.cta1': { zh: '开始创建', es: 'Probar demo gratis' },
  'home.cta2': { zh: '查看价格', es: 'Ver planes' },
  'home.nota1': { zh: '免费开始，无需信用卡', es: 'Sin tarjeta' },
  'home.nota2': { zh: '60 秒生成你的商店', es: 'Tu demo lista en 60 segundos' },
  'home.nota3': { zh: '0 平台交易佣金', es: '0 % de comisión de plataforma' },
  'home.anotacion': { zh: 'AI 生成的示例商店', es: 'Ejemplos generados por nuestra IA' },

  'home.pasos.titulo': { zh: '从一个想法\n到一个营业的商店', es: 'De la idea a vender,\nen tres pasos' },
  'home.paso1.t': { zh: '告诉我们你卖什么', es: 'Prueba el demo' },
  'home.paso1.d': {
    zh: '一句话就够了。不用注册流程，不用信用卡，手机上就能完成。',
    es: 'Un clic y tienes una tienda de prueba con productos de ejemplo, en tu móvil o PC. Sin registro complicado ni tarjeta.',
  },
  'home.paso2.t': { zh: '选择你的专属设计', es: 'Hazla tuya' },
  'home.paso2.d': {
    zh: 'AI 为你生成几套设计方案。你选中的那一套，从此只属于你。',
    es: 'Responde una encuesta sencilla y la IA te propone varios diseños creados solo para ti. Eliges uno, subes tus productos y listo.',
  },
  'home.paso3.t': { zh: '三个渠道同时上线', es: 'Publícala y vende' },
  'home.paso3.d': {
    zh: '网店、H5 和微信小程序同时生成，自动配置域名和 SSL，我们负责托管。',
    es: 'Compra tu dominio aquí mismo y publica con un clic: web, app instalable y certificado seguro, alojado por nosotros.',
  },

  'home.disenos.eyebrow': { zh: 'AI 设计师', es: 'Diseñador con IA' },
  'home.disenos.t': { zh: '没有两家店\n长得一样。', es: 'Ninguna tienda\nse parece a otra.' },
  'home.disenos.d': {
    zh: '你的设计为你而生成，登记在你的名下，然后永久下架。别人不会再拿到它，网店、H5 和小程序都一样。',
    es: 'Tu diseño se genera para ti, se registra y se retira para siempre. Nadie más lo tendrá, ni en la web ni en las apps.',
  },
  'home.disenos.remate': { zh: '你的设计，只属于你。', es: 'Tu diseño, bloqueado para ti.' },
  'home.cap1': { zh: '网店 + H5\n+ 微信小程序', es: 'Web + H5\ny mini programa' },
  'home.cap2': { zh: '域名与 SSL\n一键配置', es: 'Tu dominio,\ncomprado aquí' },
  'home.cap3': { zh: 'AI 团队\n随时在岗', es: 'Agentes de IA\nincluidos' },
  'home.cap4': { zh: '订单、库存\n与收款', es: 'Pedidos, inventario\ny pagos' },

  /* ---- planes ---- */
  'planes.t': { zh: '价格', es: 'Planes según tu modelo\nde negocio' },
  'planes.sub': {
    zh: '免费开始。0 平台交易佣金 —— 你卖多少，都是你的。',
    es: 'Empieza gratis. Paga solo cuando tu tienda sea de verdad.',
  },
  'planes.mes': { zh: '/月', es: '/mes' },
  'planes.demo': { zh: '体验版', es: 'Demo' },
  'planes.demo.precio': { zh: '免费', es: 'Gratis' },
  'planes.demo.nota': { zh: '14 天试用', es: '14 días de prueba' },
  'planes.store': { zh: '开店版', es: 'Tienda' },
  'planes.ai': { zh: 'AI 商家版', es: 'Tienda + IA' },
  'planes.omni': { zh: '全渠道版', es: 'Omnicanal' },
  'planes.elegido': { zh: '最多人选', es: 'Más elegido' },
  'planes.cta.demo': { zh: '免费开始', es: 'Empezar ahora' },
  'planes.cta.store': { zh: '创建我的商店', es: 'Crear mi tienda' },
  'planes.cta.ai': { zh: '创建我的商店', es: 'Crear mi tienda' },
  'planes.cta.omni': { zh: '联系我们', es: 'Hablar con nosotros' },
  'planes.sin.comision': { zh: '0 平台交易佣金', es: '0 % de comisión de plataforma' },


  /* ---- canales ---- */
  'canales.t': { zh: '三个渠道，\n一次生成。', es: 'Tres canales,\ngenerados a la vez.' },
  'canales.sub': {
    zh: '同一个商品库、同一批订单。改一次价格，网店、H5 和小程序同时更新。',
    es: 'Un solo catálogo y un solo flujo de pedidos. Cambias un precio una vez y se actualiza en los tres.',
  },
  'canal.web.n': { zh: '网店', es: 'Tienda web' },
  'canal.web.d': { zh: '独立域名，自动 SSL', es: 'Dominio propio y certificado automático' },
  'canal.h5.n': { zh: 'H5', es: 'H5' },
  'canal.h5.d': { zh: '微信内直接打开，扫码即达', es: 'Se abre dentro de WeChat; se entra por código QR' },
  'canal.mp.n': { zh: '微信小程序', es: 'Mini programa de WeChat' },
  'canal.mp.d': { zh: '一分钟授权，同步上架', es: 'Autorización en un minuto, catálogo sincronizado' },
  'canal.apps.n': { zh: 'iOS / Android', es: 'iOS / Android' },
  'canal.apps.d': { zh: '高级套餐提供', es: 'En los planes superiores' },
  'canal.live': { zh: '已上线', es: 'Activo' },
  'canal.plan': { zh: '高级套餐', es: 'Plan superior' },

  /* ---- equipo de IA ---- */
  'equipo.eyebrow': { zh: 'AI 团队', es: 'Equipo de IA' },
  'equipo.t': { zh: '三位 AI 员工，和你一起看店。', es: 'Tres empleados de IA, contigo en la tienda.' },
  'equipo.sub': {
    zh: '不是「AI 功能」，是三位有名字的同事。重要的操作先给你看，你点头才执行。',
    es: 'No son «funciones de IA»: son tres compañeros con nombre. Lo importante te lo enseñan antes, y solo actúan si das el visto bueno.',
  },
  'equipo.1.n': { zh: '小美', es: 'Mei' },
  'equipo.1.r': { zh: '客服 AI', es: 'Atención al cliente' },
  'equipo.1.d': { zh: '回答顾客、查订单、查库存，拿不准的转给你。', es: 'Responde a tus clientes, consulta pedidos y stock, y te pasa lo que no tiene claro.' },
  'equipo.2.n': { zh: '小林', es: 'Lin' },
  'equipo.2.r': { zh: '运营 AI', es: 'Operaciones' },
  'equipo.2.d': { zh: '盯库存、找滞销品、准备促销，等你点头再执行。', es: 'Vigila el stock, detecta lo que no se vende y prepara promociones, a la espera de tu aprobación.' },
  'equipo.3.n': { zh: '小安', es: 'An' },
  'equipo.3.r': { zh: '内容 AI', es: 'Contenido' },
  'equipo.3.d': { zh: '写商品详情、优化标题、按渠道调整文案。', es: 'Escribe las fichas, mejora los títulos y adapta el texto a cada canal.' },
  'equipo.nota': {
    zh: '三种授权级别：只建议 · 准备好等你批准 · 自动执行你允许的操作。',
    es: 'Tres niveles de autorización: solo recomienda · prepara y espera tu aprobación · ejecuta lo que autorizaste.',
  },

  /* ---- planes ---- */
  'plan.demo.n': { zh: '体验版', es: 'Demo' },
  'plan.demo.p': { zh: '免费', es: 'Gratis' },
  'plan.demo.nota': { zh: '14 天试用', es: '14 días de prueba' },
  'plan.demo.i': { zh: '完整体验店|专属设计生成|免费二级域名|AI 功能试用', es: 'Tienda de prueba completa|Diseños generados para ti|Subdominio gratuito|IA de prueba' },
  'plan.store.n': { zh: '开店版', es: 'Tienda' },
  'plan.store.nota': { zh: '按年 ¥1.990', es: 'Anual ¥1.990' },
  'plan.store.i': { zh: '网店 + H5|专属设计与域名|订单、库存与客户|SSL 与托管', es: 'Tienda web + H5|Diseño propio y dominio|Pedidos, inventario y clientes|Certificado y alojamiento' },
  'plan.ai.n': { zh: 'AI 商家版', es: 'Tienda + IA' },
  'plan.ai.nota': { zh: '按年 ¥3.990', es: 'Anual ¥3.990' },
  'plan.ai.i': { zh: '开店版全部功能|客服 AI + 内容 AI|运营 AI（建议模式）|数据分析', es: 'Todo el plan Tienda|IA de atención y de contenido|IA de operaciones (modo consejo)|Analítica' },
  'plan.omni.n': { zh: '全渠道版', es: 'Omnicanal' },
  'plan.omni.nota': { zh: '按年 ¥6.990', es: 'Anual ¥6.990' },
  'plan.omni.i': { zh: 'AI 商家版全部功能|微信小程序|完整 AI 团队|更高用量与自动化', es: 'Todo el plan Tienda + IA|Mini programa de WeChat|Equipo de IA completo|Más uso y automatizaciones' },
  'plan.cta.crear': { zh: '创建我的商店', es: 'Crear mi tienda' },
  'plan.cta.gratis': { zh: '免费开始', es: 'Empezar gratis' },
  'plan.cta.hablar': { zh: '联系我们', es: 'Hablar con nosotros' },

  /* ---- identidades, FAQ y pie ---- */
  'ident.t': { zh: '在 fábrica 可以诞生的品牌', es: 'Marcas que pueden nacer en fábrica' },
  'faq.t': { zh: '还有疑问？', es: '¿Tienes preguntas?' },
  'faq.d': { zh: '关于 fábrica 的常见问题，我们都整理好了。', es: 'Respondemos las dudas más comunes sobre fábrica.' },
  'faq.cta': { zh: '查看常见问题', es: 'Ver preguntas frecuentes' },
  'pie.producto': { zh: '产品', es: 'Producto' },
  'pie.empresa': { zh: '公司', es: 'Empresa' },
  'pie.soporte': { zh: '支持', es: 'Soporte' },
  'pie.sobre': { zh: '关于我们', es: 'Sobre nosotros' },
  'pie.contacto': { zh: '联系我们', es: 'Contacto' },
  'pie.terminos': { zh: '服务条款', es: 'Términos y condiciones' },
  'pie.privacidad': { zh: '隐私政策', es: 'Privacidad' },
  'pie.ayuda': { zh: '帮助中心', es: 'Centro de ayuda' },
  'pie.faq': { zh: '常见问题', es: 'Preguntas frecuentes' },
  'pie.estado': { zh: '系统状态', es: 'Estado del sistema' },
  'pie.hecho': { zh: 'AI 生成', es: 'Hecho con IA' },

  /* ---- onboarding ---- */
  'demo.h1': { zh: '你想卖什么？', es: '¿Qué quieres vender?' },
  'demo.sub': {
    zh: '一句话描述你的生意，我们为你生成商店、专属设计和 AI 团队。免费，无需信用卡。',
    es: 'Cuéntanos de tu negocio y la IA te propondrá diseños que no tiene nadie más. Gratis, al instante y con tu propio panel.',
  },
  'demo.que.vendes': { zh: '你卖什么？', es: '¿Qué vendes?' },
  'demo.marca': { zh: '你的品牌是什么感觉？', es: '¿Cómo es tu marca?' },
  'demo.modo': { zh: '浅色还是深色？', es: '¿Claro u oscuro?' },
  'demo.disenos': { zh: '选择你的专属设计', es: 'Elige tu diseño' },
  'demo.otros': { zh: '换一批设计', es: 'Proponme otros diseños' },
  'demo.disenando': { zh: '生成中…', es: 'Diseñando…' },
  'demo.datos': { zh: '你的信息', es: 'Tus datos' },
  'demo.nombre': { zh: '商店名称', es: 'Nombre de tu tienda' },
  'demo.nombre.ph': { zh: '例如：阿尔巴甜品店', es: 'Ej.: Dulcería Alba' },
  'demo.correo': { zh: '你的邮箱', es: 'Tu correo' },
  'demo.correo.ayuda': { zh: '登录后台的账号', es: 'Será tu usuario para entrar al panel de tu tienda.' },
  'demo.clave': { zh: '设置密码', es: 'Elige una contraseña' },
  'demo.clave.ayuda': { zh: '至少 8 位', es: 'Mínimo 8 caracteres.' },
  'demo.enviar': { zh: '生成我的商店', es: 'Crear mi tienda demo' },
  'demo.enviando': { zh: '正在生成…', es: 'Creando tu tienda…' },
  'demo.unicidad': {
    zh: '每套设计都有唯一编号。你选中后即登记在你名下，我们不会再提供给别人。',
    es: 'Cada diseño tiene una huella única: al elegirlo queda registrado para tu tienda y la fábrica no lo vuelve a ofrecer.',
  },

  'demo.listo': { zh: '你的商店已上线！', es: '¡Tu tienda está lista!' },
  'demo.listo.sub': {
    zh: '现在就可以查看、替换示例商品并接单。体验版有效期 14 天。',
    es: 'Ya puedes verla, cambiar los productos de ejemplo por los tuyos y recibir pedidos. La demo dura 14 días.',
  },
  'demo.usuario': { zh: '后台账号', es: 'Tu usuario del panel' },
  'demo.contra': { zh: '密码', es: 'Tu contraseña' },
  'demo.contra.v': { zh: '你刚才设置的密码', es: 'La que acabas de elegir' },
  'demo.ver': { zh: '查看我的商店', es: 'Ver mi tienda' },
  'demo.panel': { zh: '进入后台（商品与订单）', es: 'Entrar a mi panel (productos y pedidos)' },
  'demo.canales': { zh: '我的销售渠道（含小程序源码）', es: 'Mis canales de venta' },
  'demo.exito.nota': {
    zh: '你选中的设计已登记在你名下，我们不会再提供给任何人。',
    es: 'El diseño que elegiste queda registrado a tu nombre: la fábrica no volverá a ofrecerlo a nadie más.',
  },

  /* validación */
  'val.nombre': { zh: '请填写商店名称（至少 2 个字）。', es: 'Ponle un nombre a tu tienda (mínimo 2 letras).' },
  'val.correo': { zh: '请填写有效邮箱：这是你登录后台的账号。', es: 'Escribe un correo válido: será tu usuario del panel.' },
  'val.clave': { zh: '密码至少 8 位。', es: 'La contraseña debe tener al menos 8 caracteres.' },
  'val.diseno': { zh: '请选择一套设计。', es: 'Elige uno de los diseños propuestos.' },
  'val.error': { zh: '出错了，请重试。', es: 'Error inesperado. Inténtalo otra vez.' },

  /* ---- tienda ---- */
  'st.inicio': { zh: '首页', es: 'Inicio' },
  'st.productos': { zh: '全部商品', es: 'Productos' },
  'st.carrito': { zh: '购物车', es: 'Carrito' },
  'st.oficial': { zh: '官方商城', es: 'Tienda oficial' },
  'st.bienvenido': { zh: '欢迎来到', es: 'Bienvenido a' },
  'st.hero.txt': {
    zh: '手机下单，送货到家。每一单都由店家亲自处理。',
    es: 'Descubre nuestra selección, pide desde el móvil y recíbelo en casa. Cada pedido lo prepara y lo atiende directamente la tienda.',
  },
  'st.ver': { zh: '立即选购', es: 'Ver productos' },
  'st.v1.t': { zh: '送货到家', es: 'Envío a domicilio' },
  'st.v1.d': { zh: '24–48 小时送达', es: 'Entrega en 24–48 h' },
  'st.v2.t': { zh: '多种支付方式', es: 'Pago como prefieras' },
  'st.v2.d': { zh: '微信支付 · 支付宝 · 货到付款', es: 'Transferencia o al recibir' },
  'st.v3.t': { zh: '店家直接服务', es: 'Atención directa' },
  'st.v3.d': { zh: '有问题随时联系', es: 'Te responde la tienda' },
  'st.nuestros': { zh: '全部商品', es: 'Nuestros productos' },
  'st.articulos': { zh: '件商品', es: 'artículos' },
  'st.sin.productos': { zh: '本店还没有上架商品。', es: 'Esta tienda todavía no ha publicado productos.' },
  'st.anadir': { zh: '加入购物车', es: 'Añadir al carrito' },
  'st.anadido': { zh: '✓ 已加入', es: '✓ En el carrito' },
  'st.anadiendo': { zh: '加入中…', es: 'Añadiendo…' },
  'st.error.anadir': { zh: '加入失败，请重试', es: 'No se pudo, reintenta' },
  'st.pie.txt': { zh: '感谢你支持小店。', es: 'Gracias por comprar en una tienda pequeña.' },
  'st.creada': { zh: '由', es: 'Creada con' },
  'st.demo.banner': { zh: '这是在 fábrica 生成的体验店', es: 'Tienda demo creada en la fábrica' },
  'st.demo.caduca': { zh: '有效期至', es: 'caduca el' },
  'st.demo.crea': { zh: '免费创建你的商店', es: 'crea la tuya gratis' },
  'st.no.encontrada': { zh: '未找到该商店', es: 'Tienda no encontrada' },
  'st.no.encontrada.d': {
    zh: '这个地址没有商店，或者体验期已结束。',
    es: 'No existe ninguna tienda en esta dirección, o el demo expiró.',
  },
  'st.crear.mia': { zh: '创建我的商店', es: 'Crear mi tienda' },

  /* ---- compra ---- */
  'c.tu.carrito': { zh: '购物车', es: 'Tu carrito' },
  'c.vacio': { zh: '购物车是空的。', es: 'Tu carrito está vacío.' },
  'c.cargando': { zh: '加载中…', es: 'Cargando…' },
  'c.resumen': { zh: '订单摘要', es: 'Resumen' },
  'c.articulos': { zh: '商品件数', es: 'Artículos' },
  'c.subtotal': { zh: '小计', es: 'Subtotal' },
  'c.envio.nota': { zh: '运费在结算时计算。', es: 'El envío se calcula al finalizar la compra.' },
  'c.finalizar': { zh: '去结算', es: 'Finalizar compra' },
  'c.seguir': { zh: '继续选购', es: 'Seguir comprando' },
  'c.quitar': { zh: '减少一件', es: 'Quitar uno' },
  'c.anadir': { zh: '增加一件', es: 'Añadir uno' },
  'c.error': { zh: '购物车更新失败。', es: 'No se pudo actualizar el carrito.' },
  'c.error.cargar': { zh: '购物车加载失败。', es: 'No se pudo cargar el carrito.' },

  'ck.titulo': { zh: '结算', es: 'Finalizar compra' },
  'ck.sub': { zh: '在 {tienda} 下单', es: 'Pedido en {tienda}' },
  'ck.volver': { zh: '返回购物车', es: 'Volver al carrito' },
  'ck.datos': { zh: '联系信息', es: 'Tus datos' },
  'ck.nombre': { zh: '姓名', es: 'Nombre' },
  'ck.apellidos': { zh: '姓氏', es: 'Apellidos' },
  'ck.correo': { zh: '邮箱', es: 'Correo' },
  'ck.telefono': { zh: '手机号（选填）', es: 'Teléfono (opcional)' },
  'ck.entrega': { zh: '收货信息', es: 'Entrega' },
  'ck.direccion': { zh: '收货地址', es: 'Dirección de entrega' },
  'ck.direccion.ph': { zh: '街道、门牌号', es: 'Calle y número' },
  'ck.ciudad': { zh: '城市', es: 'Ciudad' },
  'ck.pais': { zh: '国家/地区', es: 'País' },
  'ck.pago': { zh: '支付方式', es: 'Pago' },
  'ck.pedido': { zh: '你的订单', es: 'Tu pedido' },
  'ck.envio': { zh: '运费', es: 'Envío' },
  'ck.total': { zh: '合计', es: 'Total' },
  'ck.sin.pago': { zh: '本店还没有配置支付方式。', es: 'La tienda no tiene método de pago configurado.' },
  'ck.pago.aviso': {
    zh: '平台支付通道开通前，订单先记为待付款，由店家与你确认收款。',
    es: 'Hasta activar la pasarela, el pedido queda pendiente y la tienda confirma el cobro contigo.',
  },
  'ck.confirmar': { zh: '提交订单', es: 'Confirmar pedido' },
  'ck.confirmando': { zh: '提交中…', es: 'Confirmando…' },
  'ck.faltan': { zh: '请填写姓名、邮箱和收货地址。', es: 'Completa tu nombre, correo y dirección de entrega.' },
  'ck.error': { zh: '下单失败，请重试。', es: 'No se pudo completar el pedido.' },

  'g.confirmado': { zh: '下单成功！', es: '¡Pedido confirmado!' },
  'g.gracias': { zh: '感谢你在 {tienda} 下单。', es: 'Gracias por comprar en {tienda}.' },
  'g.numero': { zh: '订单号', es: 'Número de pedido' },
  'g.total': { zh: '合计', es: 'Total' },
  'g.aviso': { zh: '通知已发送至', es: 'Aviso enviado a' },
  'g.nota': { zh: '店家会联系你确认支付和配送。', es: 'La tienda te contactará para coordinar el pago y la entrega.' },
  'g.volver': { zh: '返回商店', es: 'Volver a la tienda' },
};

/** Traduce una clave a un idioma concreto. */
export function translate(locale: Locale, key: string, vars?: Record<string, string>): string {
  const entry = D[key];
  if (!entry) return key;
  let s = entry[locale];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
  return s;
}

/**
 * Traduce en el idioma del MERCADO. Es lo que usan las páginas de tienda:
 * no dependen de la preferencia del visitante.
 */
export function t(key: string, vars?: Record<string, string>): string {
  return translate(LOCALE, key, vars);
}

const INTL: Record<Locale, string> = { zh: 'zh-CN', es: 'es' };

/** Precio formateado. La moneda viene del dato; el formato, del idioma. */
export function money(minor: number, currency?: string, locale: Locale = LOCALE): string {
  return new Intl.NumberFormat(INTL[locale], {
    style: 'currency',
    currency: currency || CURRENCY,
  }).format(minor / 100);
}

/** Fecha corta. */
export function fecha(iso: string, locale: Locale = LOCALE): string {
  return new Date(iso).toLocaleDateString(INTL[locale]);
}
