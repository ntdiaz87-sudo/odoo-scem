# -*- coding: utf-8 -*-
"""Contenido de la puerta del proveedor, en español, inglés y chino.

Los textos viven aquí y no repartidos por la plantilla para no duplicar el
marcado tres veces: la plantilla pinta la estructura y lee de este
diccionario. Añadir un cuarto idioma es añadir una clave.

No se usa el sistema de traducción de Odoo a propósito: obligaría a
instalar zh_CN en la base de datos, una operación que toca la instalación
entera. Aquí el idioma es un segmento de la URL y funciona sin más.
"""

IDIOMAS = (
    {'code': 'es', 'label': 'Español', 'short': 'ES'},
    {'code': 'en', 'label': 'English', 'short': 'EN'},
    {'code': 'zh', 'label': '简体中文', 'short': '中文'},
)

IDIOMA_POR_DEFECTO = 'en'

# Claves estables, independientes del idioma, para lo que viaja en el
# formulario. Las etiquetas cambian; estos valores no.
TIPOS_PROVEEDOR = ('manufacturer', 'oem_odm', 'brand_owner',
                   'export_company', 'distributor')

CLAVES_CATEGORIA = ('energy', 'appliances', 'electronics',
                    'mobility', 'home', 'business')


CONTENIDO = {

    # ═══════════════════════════════════════════════════════════════
    'es': {
        'meta_title': "Vender a Cuba — PYXEL Cuba Trade OS",
        'meta_description': "Cobra en tu banco, en China. Nosotros asumimos "
                            "Cuba: importación, logística y distribución.",
        'hero': {
            'eyebrow': "Para fabricantes y exportadores",
            'title': "Usted cobra en China.",
            'subtitle': "En su banco. En su moneda.",
            'claim': "Cuba es nuestro riesgo, no el suyo.",
            'lead': "Compramos en firme y pagamos a su cuenta bancaria en "
                    "China. Usted no negocia con Cuba, no asume el cobro y no "
                    "espera a que llegue un contenedor para saber si le pagan.",
            'cta': "Hablemos de su producto",
        },
        'problem': {
            'title': "Lo que normalmente frena una venta a Cuba",
            'intro': "Cuando un fabricante oye «Cuba», piensa cinco cosas. "
                     "Nuestra propuesta las elimina todas de golpe.",
            'items': [
                "No puedo confirmar una carta de crédito.",
                "No sé si me van a pagar, ni cuándo.",
                "Mi banco me va a poner problemas con la operación.",
                "No conozco a nadie que importe allí legalmente.",
                "¿Y si el contenedor se queda parado en el puerto?",
            ],
            'outro': "Con nosotros la operación deja de ser una exportación a "
                     "Cuba y pasa a ser una venta en China.",
        },
        'levels': {
            'title': "Tres formas de trabajar con nosotros",
            'intro': "Cada fabricante está en un punto distinto. Empiece por "
                     "donde le resulte cómodo.",
            'items': [
                {
                    'tag': "Nivel 1",
                    'name': "Venta en firme",
                    'claim': "Usted vende. Nosotros compramos.",
                    'body': "Compra en firme, pago a su banco en China y se "
                            "acabó su parte. Riesgo del proveedor: cero. Es "
                            "la puerta de entrada natural.",
                },
                {
                    'tag': "Nivel 2",
                    'name': "Colocación de marca",
                    'claim': "Su marca entra en Cuba, con datos de venta.",
                    'body': "Importamos y distribuimos bajo su marca en "
                            "nuestros canales, y le devolvemos algo que un "
                            "fabricante casi nunca consigue: qué modelo rota, "
                            "a qué precio y en qué provincia.",
                },
                {
                    'tag': "Nivel 3",
                    'name': "Representación",
                    'claim': "Somos su operación en Cuba.",
                    'body': "Exclusividad territorial, posventa, garantía, "
                            "repuestos y producto adaptado al mercado. Aquí "
                            "entran los acuerdos OEM y ODM.",
                },
            ],
        },
        'services': {
            'title': "Qué resolvemos por usted",
            'phases': [
                {'name': "Antes de vender", 'items': [
                    ("Inteligencia de demanda", "Qué se vende de verdad en Cuba"),
                    ("Adaptación técnica", "Que el producto funcione al enchufarlo"),
                    ("Homologación y etiquetado", "Manual en español y requisitos de entrada"),
                ]},
                {'name': "La venta", 'items': [
                    ("Compra en firme", "Cobro en China, sin exposición a Cuba"),
                    ("Consolidación mixta", "Vender sin exigir contenedor completo"),
                    ("Agregación de demanda", "Pedidos de varios compradores unificados"),
                ]},
                {'name': "Después", 'items': [
                    ("Operación de importación", "Entrada legal, aduana y documentación"),
                    ("Logística internacional", "Marítimo y aéreo hasta puerto"),
                    ("Almacenaje y distribución", "Reparto por provincia dentro de Cuba"),
                    ("Comercialización multicanal", "Mayorista, distribuidores y comercio electrónico"),
                    ("Posventa y repuestos", "Garantía real, no una promesa"),
                    ("Informe de rotación", "Datos de venta de su producto"),
                ]},
            ],
        },
        'power': {
            'title': "Un detalle que rompe equipos en Cuba",
            'lead': "China trabaja a 220 V y 50 Hz. Cuba usa 110 V y 220 V, "
                    "pero siempre a 60 Hz. Un electrodoméstico chino estándar "
                    "llega a Cuba y funciona mal, o se destruye.",
            'detail': "La frecuencia es lo grave. Todo lo que lleva motor "
                      "—refrigeradores, aires acondicionados, lavadoras, "
                      "ventiladores— gira a la velocidad equivocada a 60 Hz. "
                      "Y en energía solar, un inversor de 50 Hz sencillamente "
                      "no sincroniza con la red cubana.",
            'ask': "Por eso pedimos especificación concreta: 110 V / 60 Hz, "
                   "enchufe tipo A o B, y manual en español. Si su fábrica "
                   "puede producir esa variante, tiene una ventaja inmediata "
                   "sobre cualquier competidor que envíe el estándar chino.",
            'table_head': ("", "China", "Cuba"),
            'table': [
                ("Tensión", "220 V", "110 V y 220 V"),
                ("Frecuencia", "50 Hz", "60 Hz"),
                ("Enchufes", "A · C · I", "A · B · C · L"),
            ],
        },
        'container': {
            'tag': "Contenedor mixto",
            'title': "No hace falta un contenedor completo de un solo producto",
            'body': "El mercado cubano rara vez necesita cuarenta pies del "
                    "mismo artículo. Agrupamos la demanda de varios "
                    "compradores antes de comprar en China, y convertimos "
                    "pedidos pequeños en una operación que sí sale a cuenta.",
            'example': "Paneles solares + inversores + baterías + ventiladores "
                       "+ pequeños electrodomésticos + herramientas, en el "
                       "mismo contenedor.",
            'why': "Para usted significa vender sin exigir volúmenes que el "
                   "comprador cubano no puede asumir.",
        },
        'categories': {
            'title': "Qué estamos buscando",
            'intro': "Producto no alimenticio. Estas son las familias con "
                     "demanda comprobada.",
            'items': [
                ('energy', "Energía", "Paneles solares · inversores híbridos · "
                 "baterías de litio · estaciones de energía · sistemas completos · "
                 "generadores · accesorios eléctricos"),
                ('appliances', "Electrodomésticos", "Refrigeradores · congeladores · "
                 "aires acondicionados · lavadoras · cocinas · hornos · microondas · "
                 "ventiladores · pequeños electrodomésticos"),
                ('electronics', "Electrónica", "Televisores · monitores · tabletas · "
                 "teléfonos · computadoras · equipamiento de redes · accesorios"),
                ('mobility', "Movilidad eléctrica", "Motocicletas · triciclos · "
                 "bicicletas · vehículos eléctricos · baterías · cargadores · repuestos"),
                ('home', "Hogar y ferretería", "Muebles · equipamiento de cocina · "
                 "iluminación · herramientas · almacenamiento · ferretería"),
                ('business', "Equipamiento empresarial", "Refrigeración comercial · "
                 "equipos para restaurantes · equipamiento para pequeños negocios · "
                 "industrial ligero"),
            ],
        },
        'partnership': {
            'title': "Modelos de acuerdo",
            'items': ["Acuerdo de suministro", "Acuerdo de distribución",
                      "Distribución exclusiva", "OEM / ODM",
                      "Representación de marca", "Alianza de marketplace",
                      "Operaciones comerciales conjuntas",
                      "Tecnología y distribución"],
        },
        'form': {
            'title': "Cuéntenos qué fabrica",
            'lead': "Respondemos en 24–48 horas laborables, en su idioma.",
            'company': "Empresa", 'contact': "Persona de contacto",
            'email': "Correo electrónico", 'phone': "Teléfono o WeChat",
            'website': "Sitio web o catálogo",
            'type': "Tipo de proveedor", 'type_empty': "Seleccione una opción",
            'categories': "Categorías que fabrica o distribuye",
            'message': "Producto, capacidad y condiciones",
            'message_hint': "Cuéntenos qué fabrica, su capacidad mensual, si "
                            "puede producir a 110 V / 60 Hz y sus condiciones "
                            "habituales (incoterm, MOQ, plazo).",
            'submit': "Enviar solicitud",
            'required': "Faltan datos obligatorios: empresa, contacto y correo.",
            'bad_email': "La dirección de correo no parece válida.",
            'success_title': "Solicitud recibida",
            'success': "Gracias. Nuestro equipo comercial le responderá en "
                       "24–48 horas laborables.",
            'privacy': "Sus datos se usan únicamente para contactarle sobre "
                       "esta oportunidad comercial.",
        },
        'closing': {
            'brand': "PYXEL Cuba Trade OS",
            'line': "Tecnología · Comercio · Importación · Distribución",
            'route': "China → Cuba",
        },
    },

    # ═══════════════════════════════════════════════════════════════
    'en': {
        'meta_title': "Sell to Cuba — PYXEL Cuba Trade OS",
        'meta_description': "You get paid in China, in your own bank. "
                            "We take on Cuba: import, logistics, distribution.",
        'hero': {
            'eyebrow': "For manufacturers and exporters",
            'title': "You get paid in China.",
            'subtitle': "In your bank. In your currency.",
            'claim': "Cuba is our risk, not yours.",
            'lead': "We buy outright and pay into your bank account in China. "
                    "You do not negotiate with Cuba, you do not carry the "
                    "collection risk, and you do not wait for a container to "
                    "land to find out whether you get paid.",
            'cta': "Tell us about your product",
        },
        'problem': {
            'title': "What normally kills a sale to Cuba",
            'intro': "When a manufacturer hears \"Cuba\", five objections come "
                     "up. Our structure removes all five at once.",
            'items': [
                "I cannot get a letter of credit confirmed.",
                "I don't know whether I will be paid, or when.",
                "My bank will raise questions about the transaction.",
                "I don't know anyone who can legally import there.",
                "What if the container sits at the port?",
            ],
            'outro': "With us, the deal stops being an export to Cuba and "
                     "becomes a domestic sale in China.",
        },
        'levels': {
            'title': "Three ways to work with us",
            'intro': "Every manufacturer starts from a different place. Begin "
                     "wherever you are comfortable.",
            'items': [
                {
                    'tag': "Level 1",
                    'name': "Outright purchase",
                    'claim': "You sell. We buy.",
                    'body': "We buy outright, pay into your bank in China, and "
                            "your part is done. Supplier risk: zero. This is "
                            "the natural entry point.",
                },
                {
                    'tag': "Level 2",
                    'name': "Brand placement",
                    'claim': "Your brand enters Cuba, with sales data.",
                    'body': "We import and distribute under your brand across "
                            "our channels, and give you something a factory "
                            "rarely gets: which model turns over, at what "
                            "price, in which province.",
                },
                {
                    'tag': "Level 3",
                    'name': "Representation",
                    'claim': "We are your operation in Cuba.",
                    'body': "Territorial exclusivity, after-sales, warranty, "
                            "spare parts and market-adapted product. This is "
                            "where OEM and ODM agreements live.",
                },
            ],
        },
        'services': {
            'title': "What we handle for you",
            'phases': [
                {'name': "Before selling", 'items': [
                    ("Demand intelligence", "What actually sells in Cuba"),
                    ("Technical adaptation", "So the product works when plugged in"),
                    ("Compliance and labelling", "Spanish manual and entry requirements"),
                ]},
                {'name': "The sale", 'items': [
                    ("Outright purchase", "Paid in China, no exposure to Cuba"),
                    ("Mixed consolidation", "Sell without demanding a full container"),
                    ("Demand aggregation", "Orders from several buyers combined"),
                ]},
                {'name': "Afterwards", 'items': [
                    ("Import operation", "Legal entry, customs and paperwork"),
                    ("International logistics", "Sea and air freight to port"),
                    ("Warehousing and distribution", "Province-level delivery inside Cuba"),
                    ("Multichannel commercialisation", "Wholesale, distributors and e-commerce"),
                    ("After-sales and spares", "A real warranty, not a promise"),
                    ("Turnover report", "Sales data on your product"),
                ]},
            ],
        },
        'power': {
            'title': "The detail that destroys equipment in Cuba",
            'lead': "China runs at 220 V and 50 Hz. Cuba uses 110 V and 220 V, "
                    "but always at 60 Hz. A standard Chinese appliance arrives "
                    "in Cuba and either works badly or burns out.",
            'detail': "Frequency is the serious part. Anything with a motor "
                      "— refrigerators, air conditioners, washing machines, "
                      "fans — runs at the wrong speed on 60 Hz. And in solar, "
                      "a 50 Hz inverter simply will not synchronise with the "
                      "Cuban grid.",
            'ask': "That is why we ask for a specific build: 110 V / 60 Hz, "
                   "Type A or B plug, Spanish manual. If your factory can "
                   "produce that variant, you hold an immediate advantage over "
                   "any competitor shipping the Chinese standard.",
            'table_head': ("", "China", "Cuba"),
            'table': [
                ("Voltage", "220 V", "110 V and 220 V"),
                ("Frequency", "50 Hz", "60 Hz"),
                ("Plug types", "A · C · I", "A · B · C · L"),
            ],
        },
        'container': {
            'tag': "Mixed container",
            'title': "You don't need a full container of a single product",
            'body': "The Cuban market rarely needs forty feet of the same "
                    "item. We aggregate demand from several buyers before "
                    "purchasing in China, turning small orders into an "
                    "operation that actually makes sense.",
            'example': "Solar panels + inverters + batteries + fans + small "
                       "appliances + tools, in the same container.",
            'why': "For you it means selling without demanding volumes the "
                   "Cuban buyer cannot commit to.",
        },
        'categories': {
            'title': "What we are sourcing",
            'intro': "Non-food goods. These are the families with proven demand.",
            'items': [
                ('energy', "Energy", "Solar panels · hybrid inverters · lithium "
                 "batteries · power stations · complete systems · generators · "
                 "electrical accessories"),
                ('appliances', "Home appliances", "Refrigerators · freezers · air "
                 "conditioners · washing machines · cookers · ovens · microwaves · "
                 "fans · small appliances"),
                ('electronics', "Electronics", "Televisions · monitors · tablets · "
                 "smartphones · computers · networking equipment · accessories"),
                ('mobility', "Electric mobility", "Motorcycles · tricycles · bicycles · "
                 "electric vehicles · batteries · chargers · spare parts"),
                ('home', "Home and hardware", "Furniture · kitchen equipment · "
                 "lighting · tools · storage · hardware"),
                ('business', "Business equipment", "Commercial refrigeration · "
                 "restaurant equipment · small-business equipment · light industrial"),
            ],
        },
        'partnership': {
            'title': "Agreement models",
            'items': ["Supplier agreement", "Distribution agreement",
                      "Exclusive distribution", "OEM / ODM",
                      "Brand representation", "Marketplace partnership",
                      "Joint commercial operations",
                      "Technology and distribution"],
        },
        'form': {
            'title': "Tell us what you manufacture",
            'lead': "We reply within 24–48 business hours, in your language.",
            'company': "Company", 'contact': "Contact person",
            'email': "Email", 'phone': "Phone or WeChat",
            'website': "Website or catalogue",
            'type': "Supplier type", 'type_empty': "Select one",
            'categories': "Categories you manufacture or distribute",
            'message': "Product, capacity and terms",
            'message_hint': "Tell us what you make, your monthly capacity, "
                            "whether you can build 110 V / 60 Hz, and your "
                            "usual terms (incoterm, MOQ, lead time).",
            'submit': "Send enquiry",
            'required': "Missing required fields: company, contact and email.",
            'bad_email': "That email address does not look valid.",
            'success_title': "Enquiry received",
            'success': "Thank you. Our commercial team will reply within "
                       "24–48 business hours.",
            'privacy': "Your details are used only to contact you about this "
                       "business opportunity.",
        },
        'closing': {
            'brand': "PYXEL Cuba Trade OS",
            'line': "Technology · Trade · Import · Distribution",
            'route': "China → Cuba",
        },
    },

    # ═══════════════════════════════════════════════════════════════
    'zh': {
        'meta_title': "销往古巴 — PYXEL Cuba Trade OS",
        'meta_description': "货款在中国支付到您的银行账户。古巴的风险由我们承担：进口、物流与分销。",
        'hero': {
            'eyebrow': "致中国制造商与出口商",
            'title': "您在中国收款。",
            'subtitle': "汇入您的银行账户，使用您的货币。",
            'claim': "古巴的风险由我们承担，与您无关。",
            'lead': "我们买断货物，并将货款支付到您在中国的银行账户。"
                    "您无需与古巴方谈判，不承担收款风险，"
                    "也不必等到集装箱到港才知道能否收到钱。",
            'cta': "介绍您的产品",
        },
        'problem': {
            'title': "对古巴出口通常卡在哪里",
            'intro': "制造商听到「古巴」，通常会想到五个问题。我们的模式一次性全部解决。",
            'items': [
                "信用证无法保兑。",
                "不确定能否收到货款，也不知道何时收到。",
                "银行会对这笔业务提出疑问。",
                "在当地没有可以合法进口的合作方。",
                "万一集装箱滞留港口怎么办？",
            ],
            'outro': "与我们合作，这笔生意不再是「出口到古巴」，而是一笔在中国境内完成的销售。",
        },
        'levels': {
            'title': "三种合作方式",
            'intro': "每家工厂的情况不同，您可以从最有把握的方式开始。",
            'items': [
                {
                    'tag': "第一级",
                    'name': "买断采购",
                    'claim': "您负责供货，我们负责买单。",
                    'body': "我们买断货物，货款支付到您在中国的银行账户，"
                            "您的部分即告结束。供应商风险为零，这是最自然的起点。",
                },
                {
                    'tag': "第二级",
                    'name': "品牌落地",
                    'claim': "您的品牌进入古巴，并获得销售数据。",
                    'body': "我们以您的品牌进口并在自有渠道分销，"
                            "同时向您反馈工厂通常拿不到的信息："
                            "哪款产品周转快、售价多少、在哪个省份销售。",
                },
                {
                    'tag': "第三级",
                    'name': "全权代理",
                    'claim': "我们就是您在古巴的业务团队。",
                    'body': "区域独家、售后、保修、备件供应以及针对市场调整的产品。"
                            "OEM 与 ODM 合作属于这一层级。",
                },
            ],
        },
        'services': {
            'title': "我们为您解决的事",
            'phases': [
                {'name': "销售之前", 'items': [
                    ("需求情报", "古巴市场真正在买什么"),
                    ("技术适配", "确保产品插上电就能正常工作"),
                    ("认证与标签", "西班牙语说明书及入境要求"),
                ]},
                {'name': "销售环节", 'items': [
                    ("买断采购", "在中国收款，不接触古巴风险"),
                    ("混装拼柜", "无需整柜即可成交"),
                    ("需求归集", "汇总多个买家的订单"),
                ]},
                {'name': "销售之后", 'items': [
                    ("进口操作", "合法入境、清关与单证"),
                    ("国际物流", "海运与空运至港口"),
                    ("仓储与分销", "古巴境内按省配送"),
                    ("多渠道销售", "批发、分销商与电子商务"),
                    ("售后与备件", "真正可执行的保修，而非口头承诺"),
                    ("周转报告", "您产品的实际销售数据"),
                ]},
            ],
        },
        'power': {
            'title': "一个会烧毁设备的细节",
            'lead': "中国电网为 220 V、50 Hz；古巴使用 110 V 和 220 V，"
                    "但频率始终是 60 Hz。中国标准家电运到古巴后，轻则工作异常，重则直接损坏。",
            'detail': "频率才是关键。所有带电机的产品——冰箱、空调、洗衣机、风扇——"
                      "在 60 Hz 下转速都不正确。在光伏方面，"
                      "50 Hz 的逆变器根本无法与古巴电网同步。",
            'ask': "因此我们明确要求：110 V / 60 Hz，A 型或 B 型插头，"
                   "配西班牙语说明书。如果贵厂能生产该版本，"
                   "相较任何按中国标准发货的竞争者，您立刻具备优势。",
            'table_head': ("", "中国", "古巴"),
            'table': [
                ("电压", "220 V", "110 V 与 220 V"),
                ("频率", "50 Hz", "60 Hz"),
                ("插头", "A · C · I", "A · B · C · L"),
            ],
        },
        'container': {
            'tag': "混装集装箱",
            'title': "不必整柜发运同一款产品",
            'body': "古巴市场很少需要一整个四十尺柜的同款货物。"
                    "我们在中国采购之前先归集多个买家的需求，"
                    "把零散订单整合成一笔真正划算的操作。",
            'example': "太阳能板 + 逆变器 + 电池 + 风扇 + 小家电 + 工具，同柜发运。",
            'why': "对您而言，这意味着无需要求古巴买家承担他们做不到的起订量。",
        },
        'categories': {
            'title': "我们正在寻找的品类",
            'intro': "非食品类商品。以下是需求已得到验证的品类。",
            'items': [
                ('energy', "能源", "太阳能板 · 混合逆变器 · 锂电池 · 户外电源 · "
                 "整套系统 · 发电机 · 电气配件"),
                ('appliances', "家用电器", "冰箱 · 冷柜 · 空调 · 洗衣机 · 炉灶 · "
                 "烤箱 · 微波炉 · 风扇 · 小家电"),
                ('electronics', "电子产品", "电视机 · 显示器 · 平板 · 智能手机 · "
                 "电脑 · 网络设备 · 配件"),
                ('mobility', "电动出行", "电动摩托车 · 电动三轮车 · 电动自行车 · "
                 "电动汽车 · 电池 · 充电器 · 备件"),
                ('home', "家居与五金", "家具 · 厨房设备 · 照明 · 工具 · 储物 · 五金"),
                ('business', "商用设备", "商用制冷 · 餐饮设备 · 小微企业设备 · 轻工业设备"),
            ],
        },
        'partnership': {
            'title': "合作模式",
            'items': ["供货协议", "分销协议", "独家分销", "OEM / ODM",
                      "品牌代理", "平台合作", "联合商业运营", "技术与分销合作"],
        },
        'form': {
            'title': "请介绍贵厂的产品",
            'lead': "我们将在 24–48 个工作小时内以您的语言回复。",
            'company': "公司名称", 'contact': "联系人",
            'email': "电子邮箱", 'phone': "电话或微信",
            'website': "网站或产品目录",
            'type': "供应商类型", 'type_empty': "请选择",
            'categories': "贵厂生产或经销的品类",
            'message': "产品、产能与交易条件",
            'message_hint': "请说明贵厂生产什么、月产能、"
                            "是否可生产 110 V / 60 Hz 版本，"
                            "以及常规条件（贸易术语、起订量、交期）。",
            'submit': "提交咨询",
            'required': "必填项未填写：公司名称、联系人与邮箱。",
            'bad_email': "邮箱地址格式似乎不正确。",
            'success_title': "咨询已收到",
            'success': "感谢您的来信。我们的商务团队将在 24–48 个工作小时内回复。",
            'privacy': "您提供的信息仅用于就本次商业机会与您联系。",
        },
        'closing': {
            'brand': "PYXEL Cuba Trade OS",
            'line': "技术 · 贸易 · 进口 · 分销",
            'route': "中国 → 古巴",
        },
    },
}


# Etiquetas de los tipos de proveedor, por idioma. Los valores que viajan
# en el formulario son los de TIPOS_PROVEEDOR y no cambian.
ETIQUETAS_TIPO = {
    'es': {
        'manufacturer': "Fabricante",
        'oem_odm': "Fabricante OEM / ODM",
        'brand_owner': "Propietario de marca",
        'export_company': "Empresa exportadora",
        'distributor': "Distribuidor",
    },
    'en': {
        'manufacturer': "Manufacturer",
        'oem_odm': "OEM / ODM manufacturer",
        'brand_owner': "Brand owner",
        'export_company': "Export company",
        'distributor': "Distributor",
    },
    'zh': {
        'manufacturer': "生产厂家",
        'oem_odm': "OEM / ODM 厂家",
        'brand_owner': "品牌方",
        'export_company': "出口企业",
        'distributor': "经销商",
    },
}
