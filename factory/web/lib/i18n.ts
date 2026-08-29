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

  /* ---------------- back office del comerciante ---------------- */
  'pn.titulo': { zh: '商家后台', es: 'Panel de mi tienda' },
  'pn.entrar': { zh: '登录后台', es: 'Entrar a mi panel' },
  'pn.entrar.sub': { zh: '用你创建商店时填的邮箱和密码登录。', es: 'Entra con el correo y la contraseña que pusiste al crear tu tienda.' },
  'pn.correo': { zh: '邮箱', es: 'Correo' },
  'pn.clave': { zh: '密码', es: 'Contraseña' },
  'pn.entrando': { zh: '正在登录…', es: 'Entrando…' },
  'pn.mal': { zh: '邮箱或密码不对。', es: 'El correo o la contraseña no son correctos.' },
  'pn.sintienda': { zh: '这个账号还没有商店。', es: 'Esta cuenta todavía no tiene ninguna tienda.' },
  'pn.salir': { zh: '退出', es: 'Salir' },
  'pn.vertienda': { zh: '查看我的商店', es: 'Ver mi tienda' },

  'pn.nav.inicio': { zh: '概览', es: 'Resumen' },
  'pn.nav.productos': { zh: '商品', es: 'Productos' },
  'pn.nav.pedidos': { zh: '订单', es: 'Pedidos' },
  'pn.nav.tienda': { zh: '店铺', es: 'Mi tienda' },

  'pn.hoy': { zh: '今天', es: 'Hoy' },
  'pn.hoy.pedidos': { zh: '今日订单', es: 'Pedidos de hoy' },
  'pn.hoy.ingresos': { zh: '今日收入', es: 'Ingresos de hoy' },
  'pn.porcobrar': { zh: '待收款', es: 'Por cobrar' },
  'pn.porenviar': { zh: '待发货', es: 'Por enviar' },
  'pn.enventa': { zh: '在售商品', es: 'Productos a la venta' },
  'pn.sinstock': { zh: '已售罄', es: 'Sin existencias' },
  'pn.pendientes': { zh: '需要你处理', es: 'Necesitan que hagas algo' },
  'pn.aldia': { zh: '一切都处理完了。', es: 'No tienes nada pendiente.' },

  'pn.pr.titulo': { zh: '我的商品', es: 'Mis productos' },
  'pn.pr.nuevo': { zh: '新增商品', es: 'Añadir producto' },
  'pn.pr.vacio': { zh: '还没有商品。加一个就能开卖。', es: 'Todavía no tienes productos. Añade uno y ya puedes vender.' },
  'pn.pr.nombre': { zh: '商品名称', es: 'Nombre del producto' },
  'pn.pr.desc': { zh: '商品描述', es: 'Descripción' },
  'pn.pr.precio': { zh: '售价', es: 'Precio' },
  'pn.pr.stock': { zh: '库存', es: 'Existencias' },
  'pn.pr.publicado': { zh: '上架中', es: 'A la venta' },
  'pn.pr.oculto': { zh: '已下架', es: 'Oculto' },
  'pn.pr.publicar': { zh: '上架', es: 'Poner a la venta' },
  'pn.pr.ocultar': { zh: '下架', es: 'Quitar de la venta' },
  'pn.pr.guardar': { zh: '保存', es: 'Guardar' },
  'pn.pr.guardando': { zh: '保存中…', es: 'Guardando…' },
  'pn.pr.guardado': { zh: '已保存，商店已更新。', es: 'Guardado. Tu tienda ya lo muestra.' },
  'pn.pr.crear': { zh: '创建商品', es: 'Crear producto' },
  'pn.pr.creado': { zh: '商品已创建。', es: 'Producto creado.' },
  'pn.pr.falta': { zh: '请填写名称和售价。', es: 'Pon al menos un nombre y un precio.' },
  'pn.pr.foto': { zh: '商品图片', es: 'Foto del producto' },
  'pn.pr.foto.ayuda': { zh: 'JPG 或 PNG，最大 5 MB。', es: 'JPG o PNG, hasta 5 MB.' },
  'pn.pr.sinfoto': { zh: '暂无图片', es: 'Sin foto' },
  'pn.pr.volver': { zh: '返回商品列表', es: 'Volver a productos' },

  'pn.pe.titulo': { zh: '我的订单', es: 'Mis pedidos' },
  'pn.pe.vacio': { zh: '还没有订单。', es: 'Todavía no tienes pedidos.' },
  'pn.pe.numero': { zh: '订单号', es: 'Pedido' },
  'pn.pe.cliente': { zh: '买家', es: 'Cliente' },
  'pn.pe.fecha': { zh: '下单时间', es: 'Fecha' },
  'pn.pe.total': { zh: '金额', es: 'Importe' },
  'pn.pe.estado': { zh: '状态', es: 'Estado' },
  'pn.pe.entrega': { zh: '收货信息', es: 'Datos de entrega' },
  'pn.pe.articulos': { zh: '商品', es: 'Artículos' },
  'pn.pe.cobrar': { zh: '标记为已收款', es: 'Marcar como cobrado' },
  'pn.pe.cobrado': { zh: '已收款', es: 'Cobrado' },
  'pn.pe.enviar': { zh: '标记为已发货', es: 'Marcar como enviado' },
  'pn.pe.enviado': { zh: '已发货', es: 'Enviado' },
  'pn.pe.seguimiento': { zh: '快递单号（可不填）', es: 'Número de seguimiento (opcional)' },
  'pn.pe.volver': { zh: '返回订单列表', es: 'Volver a pedidos' },
  'pn.pe.pendientecobro': { zh: '待收款', es: 'Falta cobrar' },
  'pn.pe.hecho': { zh: '已完成', es: 'Completado' },

  'pn.ti.titulo': { zh: '店铺设置', es: 'Ajustes de mi tienda' },
  'pn.ti.nombre': { zh: '店铺名称', es: 'Nombre de la tienda' },
  'pn.ti.direccion': { zh: '店铺网址', es: 'Dirección de tu tienda' },
  'pn.ti.canales': { zh: '销售渠道和小程序', es: 'Canales y mini programa' },
  'pn.ti.canales.sub': { zh: '生成你的微信小程序，查看上架步骤。', es: 'Genera tu mini programa de WeChat y mira los pasos para publicarlo.' },
  'pn.ti.avanzado': { zh: '高级控制台', es: 'Consola avanzada' },
  'pn.ti.avanzado.sub': { zh: '完整的电商后台。不用它也能把店开起来。', es: 'La consola completa. No la necesitas para llevar tu tienda.' },
  'pn.ti.abrir': { zh: '打开', es: 'Abrir' },

  'pn.error': { zh: '操作失败：{msg}', es: 'No se pudo completar: {msg}' },

  /* ------------------------- home V2 ------------------------- */
  'v.tema.claro': { zh: '切换到浅色', es: 'Cambiar a claro' },
  'v.tema.oscuro': { zh: '切换到深色', es: 'Cambiar a oscuro' },

  'v.nav.producto': { zh: '产品', es: 'Producto' },
  'v.nav.plantillas': { zh: '模板', es: 'Plantillas' },
  'v.nav.equipo': { zh: 'AI 团队', es: 'Equipo AI' },
  'v.nav.casos': { zh: '案例', es: 'Casos' },
  'v.nav.precios': { zh: '价格', es: 'Precios' },
  'v.nav.entrar': { zh: '登录', es: 'Entrar' },
  'v.nav.crear': { zh: '免费创建商店', es: 'Crear tienda gratis' },
  'v.nav.menu': { zh: '菜单', es: 'Menú' },

  'v.hero.h1a': { zh: '你的商店，', es: 'Tu tienda' },
  'v.hero.h1b': { zh: '从这里开始。', es: 'empieza aquí.' },
  'v.hero.sub': {
    zh: '选择一个专业模板，或者让 AI 为你创造一个专属设计。网店、H5、微信小程序和 AI 团队，共用一个商业核心。',
    es: 'Elige una plantilla profesional o deja que la IA cree un diseño exclusivo para ti. Web, H5, mini programa de WeChat y tu equipo de IA, sobre un mismo núcleo comercial.',
  },
  'v.hero.ph': { zh: '描述你想卖什么，例如：高端女装、咖啡、数码产品…', es: 'Describe qué quieres vender: moda premium, café, tecnología…' },
  'v.hero.cta1': { zh: '浏览模板', es: 'Explorar plantillas' },
  'v.hero.cta2': { zh: 'AI 设计专属商店', es: 'Diseñar con IA' },
  'v.hero.p1': { zh: '60 秒开始创建', es: 'Empieza en 60 segundos' },
  'v.hero.p2': { zh: '无需信用卡', es: 'Sin tarjeta' },
  'v.hero.p3': { zh: '0% 平台交易佣金', es: '0% de comisión de plataforma' },
  'v.hero.enviar': { zh: '开始', es: 'Empezar' },

  'v.tpl.h2': { zh: '找到适合你的设计', es: 'Encuentra un diseño para tu negocio' },
  'v.tpl.sub': { zh: '专业设计，快速上线；先选一个，再让 AI 帮你变成自己的。', es: 'Diseño profesional para salir rápido. Elige uno y deja que la IA lo adapte a tu marca.' },
  'v.tpl.todas': { zh: '推荐', es: 'Recomendadas' },
  'v.tpl.previsualizar': { zh: '预览', es: 'Previsualizar' },
  'v.tpl.usar': { zh: '使用这个设计', es: 'Usar este diseño' },
  'v.tpl.gratis': { zh: '免费', es: 'Gratis' },
  'v.tpl.volver': { zh: '返回模板', es: 'Volver a plantillas' },
  'v.tpl.escritorio': { zh: '电脑', es: 'Escritorio' },
  'v.tpl.movil': { zh: '手机', es: 'Móvil' },
  'v.tpl.reutilizable': {
    zh: '模板可以被多个商家使用。想要独一无二的设计，选 AI 专属设计。',
    es: 'Las plantillas pueden usarlas varios comercios. Si quieres un diseño irrepetible, elige el diseño exclusivo con IA.',
  },

  'v.dos.h2': { zh: '两种方式创建你的商店', es: 'Dos formas de crear tu tienda' },
  'v.dos.a.t': { zh: '选择专业模板', es: 'Elegir una plantilla' },
  'v.dos.a.1': { zh: '立即可用', es: 'Lista para usar' },
  'v.dos.a.2': { zh: '专业设计', es: 'Diseño profesional' },
  'v.dos.a.3': { zh: '可由 AI 继续定制', es: 'Personalizable con IA' },
  'v.dos.a.cta': { zh: '浏览模板', es: 'Explorar plantillas' },
  'v.dos.b.t': { zh: 'AI 专属设计', es: 'Diseño exclusivo con IA' },
  'v.dos.b.1': { zh: '为你的品牌打造', es: 'Creado para tu marca' },
  'v.dos.b.2': { zh: '独一无二', es: 'Irrepetible' },
  'v.dos.b.3': { zh: '选中后永久下架', es: 'Se retira al elegirlo' },
  'v.dos.b.cta': { zh: 'AI 为我设计', es: 'Que la IA lo diseñe' },

  'v.canal.h2a': { zh: '一次创建，', es: 'Créala una vez.' },
  'v.canal.h2b': { zh: '到处销售。', es: 'Vende en todas partes.' },
  'v.canal.sub': { zh: '同一个商品库、同一批订单、同一份库存。', es: 'Un catálogo, los mismos pedidos y un inventario único.' },
  'v.canal.web': { zh: '网店', es: 'Tienda web' },
  'v.canal.web.d': { zh: '独立域名，专业展示', es: 'Tu dominio, escaparate propio' },
  'v.canal.h5': { zh: 'H5 商店', es: 'Tienda H5' },
  'v.canal.h5.d': { zh: '移动端优先，快速访问', es: 'Pensada para el móvil, carga rápida' },
  'v.canal.wx': { zh: '微信小程序', es: 'Mini programa de WeChat' },
  'v.canal.wx.d': { zh: '一键发布，触达微信用户', es: 'Publícalo y llega a los usuarios de WeChat' },

  'v.sync.h2a': { zh: '改一次，', es: 'Cambia una vez.' },
  'v.sync.h2b': { zh: '所有渠道同步。', es: 'Todo se actualiza.' },
  'v.sync.sub': { zh: '价格、库存、内容和促销只改一次，所有渠道自动更新。', es: 'Precio, inventario, contenido y promociones se actualizan en todos los canales desde un solo sitio.' },
  'v.sync.agente': { zh: 'AI 助手', es: 'Asistente IA' },
  'v.sync.orden': { zh: '改为 ¥799', es: 'Cambiar a ¥799' },
  'v.sync.probar': { zh: '演示一次', es: 'Ver la demo' },
  'v.sync.reiniciar': { zh: '重新演示', es: 'Repetir' },
  'v.sync.producto': { zh: '智能手表', es: 'Reloj inteligente' },
  'v.sync.wechat': { zh: '微信', es: 'WeChat' },
  'w.fuente.grotesque': { zh: '无衬线', es: 'Grotesca' },
  'w.fuente.serif': { zh: '衬线', es: 'Serif' },

  'v.fab.h2': { zh: 'AI 商品工厂', es: 'Fábrica de productos con IA' },
  'v.fab.sub': { zh: '一张照片、一个链接或一个 Excel，就能创建可直接销售的商品。', es: 'Convierte una foto, un enlace o un Excel en un producto listo para vender.' },
  'v.fab.e1': { zh: '商品照片', es: 'Foto del producto' },
  'v.fab.e2': { zh: '商品链接', es: 'Enlace' },
  'v.fab.e3': { zh: 'Excel 表格', es: 'Hoja de Excel' },
  'v.fab.analiza': { zh: 'fábrica. AI 正在分析', es: 'fábrica. AI está analizando' },
  'v.fab.c1': { zh: '商品标题', es: 'Título del producto' },
  'v.fab.c2': { zh: '分类', es: 'Categoría' },
  'v.fab.c3': { zh: '商品描述', es: 'Descripción' },
  'v.fab.c4': { zh: '卖点提炼', es: 'Puntos de venta' },
  'v.fab.c5': { zh: 'SEO 优化', es: 'SEO' },
  'v.fab.c6': { zh: '各渠道文案', es: 'Texto por canal' },
  'v.fab.publicar': { zh: '发布商品', es: 'Publicar producto' },

  'v.ai.h2a': { zh: '你的商店，', es: 'No operas' },
  'v.ai.h2b': { zh: '不是你一个人在运营。', es: 'tu tienda solo.' },
  'v.ai.sub': { zh: '三位 AI 同事 7×24 小时帮你看店。重要操作先给你看，你批准后再执行。', es: 'Tres compañeros de IA trabajan 24/7. Las acciones importantes pasan por tu aprobación antes de ejecutarse.' },
  'v.ai.trabajando': { zh: '工作中', es: 'Trabajando' },

  'v.cmd.h2': { zh: '用一句话管理你的生意。', es: 'Gestiona tu negocio con una frase.' },
  'v.cmd.ej': { zh: '把库存超过 50 件的商品做一个周末促销', es: 'Crea una promoción de fin de semana para los productos con más de 50 unidades' },
  'v.cmd.plan': { zh: '建议的方案', es: 'Plan propuesto' },
  'v.cmd.encontrado': { zh: '找到 7 件符合条件的商品', es: '7 productos cumplen la condición' },
  'v.cmd.desc': { zh: '八五折', es: '15 % de descuento' },
  'v.cmd.cuando': { zh: '周六 00:00 → 周日 23:59', es: 'Sábado 00:00 → domingo 23:59' },
  'v.cmd.aprobar': { zh: '批准执行', es: 'Aprobar' },
  'v.cmd.hecho': { zh: '促销已发布，三个渠道同步完成', es: 'Promoción publicada y sincronizada en los tres canales' },

  'v.casos.h2': { zh: '用 fábrica. 做出来的商店', es: 'Tiendas hechas con fábrica.' },
  'v.casos.sub': { zh: '八套模板，八种完全不同的商店。', es: 'Ocho plantillas, ocho tiendas completamente distintas.' },

  'v.pr.h2': { zh: '简单透明的价格', es: 'Precios simples y transparentes' },
  'v.pr.sub': { zh: '免费开始。0% 平台交易佣金。', es: 'Empieza gratis. 0 % de comisión de plataforma.' },
  'v.pr.mes': { zh: '/月', es: '/mes' },
  'v.pr.reco': { zh: '推荐', es: 'Recomendado' },
  'v.pr.elegir': { zh: '选择', es: 'Elegir' },
  'v.pr.anual': { zh: '按年 {precio}', es: '{precio} al año' },

  'v.faq.h2': { zh: '常见问题', es: 'Preguntas frecuentes' },

  'v.final.h2': { zh: '准备好开始你的生意了吗？', es: '¿Listo para empezar tu negocio?' },

  'v.pie.producto': { zh: '产品', es: 'Producto' },
  'v.pie.empresa': { zh: '公司', es: 'Empresa' },
  'v.pie.derechos': { zh: '版权所有', es: 'Todos los derechos reservados' },

  'v.demo': { zh: '演示', es: 'Demostración' },
  'v.demo.aviso': { zh: '这是界面演示，不会真的改动你的商店。', es: 'Es una demostración de interfaz: no modifica ninguna tienda real.' },
  'v.muestra': { zh: '示例内容', es: 'Contenido de muestra' },

  /* ---------------------- asistente V2 ---------------------- */
  'w.paso': { zh: '第 {n} 步 / 共 {t} 步', es: 'Paso {n} de {t}' },
  'w.atras': { zh: '上一步', es: 'Atrás' },
  'w.bif.t': { zh: '你想怎么开始？', es: '¿Cómo quieres empezar?' },
  'w.bif.sub': { zh: '两条路都能在几分钟内开店。', es: 'Las dos te dejan la tienda abierta en minutos.' },
  'w.bif.tpl': { zh: '选择专业模板', es: 'Elegir una plantilla' },
  'w.bif.tpl.d': { zh: '八套做好的设计，立即可用。', es: 'Ocho diseños listos, disponibles ya.' },
  'w.bif.ai': { zh: 'AI 专属设计', es: 'Diseño exclusivo con IA' },
  'w.bif.ai.d': { zh: '为你的品牌生成，选中后永久下架。', es: 'Generado para tu marca y retirado en cuanto lo eliges.' },
  'w.tpl.t': { zh: '挑一套模板', es: 'Elige una plantilla' },
  'w.tpl.sub': { zh: '之后随时可以让 AI 继续调整。', es: 'Luego puedes pedirle a la IA que la ajuste.' },
  'w.tpl.elegida': { zh: '已选择', es: 'Elegida' },
  'w.reclamo.t': { zh: '这个设计现在只属于你。', es: 'Este diseño ahora es solo tuyo.' },
  'w.reclamo.d': { zh: 'fábrica. 不会再把它提供给其他商家。', es: 'fábrica. no volverá a ofrecerlo a otro comercio.' },
  'w.continuar': { zh: '继续', es: 'Continuar' },
  'w.reutilizable': { zh: '模板可以被多个商家使用。', es: 'Esta plantilla pueden usarla varios comercios.' },
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
