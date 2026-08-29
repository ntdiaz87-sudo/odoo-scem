# Informe — Adaptación de `fábrica.` al mercado chino

**Fecha:** 29 de agosto de 2026
**Estado:** producto adaptado, probado y desplegado. 65/65 pruebas en verde.

---

## 1. Qué se hizo

Cinco iteraciones sobre el producto ya construido. **No se partió de cero:**
la arquitectura multi-tienda encaja con los dos requisitos duros de China (un
dominio raíz con registro ICP más subdominios, y un sub-comerciante por
tienda), así que lo que cambió fue el idioma, la moneda, los canales, los
pagos y el posicionamiento.

### Base del mercado
- **Chino como idioma del producto**, no como traducción. Sistema propio sin
  dependencias nuevas; español disponible como secundario.
- **Yuan** con precios verosímiles del mercado (no conversiones del dólar),
  canales en `zh_Hans`, zona y países de Asia, tipografías Noto Sans/Serif SC.

### Posicionamiento
- El home dejó de ser «crea tu tienda» y pasó a **商店工厂**: *一句话，生成你
  的完整商店。独一无二。*
- **Sección de canales**: 网店 / H5 / 微信小程序 / apps, con su estado.
- **Equipo de IA**: tres empleados con nombre — 小美 (客服), 小林 (运营),
  小安 (内容) — en lugar de presentar la IA como «funciones». Con los tres
  niveles de autorización: solo recomienda, prepara y espera tu aprobación,
  ejecuta lo que autorizaste.
- **Planes en yuan** ¥199 / ¥399 / ¥699 más 体验版, con **0 平台交易佣金**
  como argumento central.
- Pie con hueco para el **número de registro ICP**, obligatorio en China.

### Pagos
- Manejadores de **微信支付** y **支付宝** bajo el modelo de **proveedor de
  servicios (服务商)**: cada tienda es un sub-comerciante con su propio
  子商户号 guardado en su canal.
- El checkout ofrece los tres métodos que un comprador chino espera
  (微信支付 / 支付宝 / 货到付款).
- **Sin credenciales todavía**, el pedido queda autorizado y lo concilia el
  comerciante. Cuando lleguen, hay que rellenar dos funciones: ni el checkout
  ni el panel cambian.

### Mini programa de WeChat — el mayor diferenciador
- Un **generador produce el código fuente completo** del mini programa de cada
  tienda: 19 ficheros (catálogo, carrito y pedido), pintados con **sus** tokens
  de diseño y conectados a **su** canal del API.
- **No depende de que la fábrica sea proveedor certificado de Tencent:** el
  comerciante lo sube con su propia cuenta. Cuando la fábrica se certifique,
  el mismo generador alimentará el despliegue por API.
- Panel **我的销售渠道** (`/canales/<tienda>`): el comerciante ve sus canales,
  genera el código, lo revisa fichero a fichero y tiene los pasos de subida y
  de 备案.

---

## 2. Dos fallos de fondo encontrados y corregidos

**El panel editaba y la tienda no cambiaba.** El canal de cada tienda es
`zh_Hans`, pero el panel de Vendure guarda en su idioma de interfaz (inglés
por defecto). Un comerciante chino cambiaba el nombre de un producto y su
tienda seguía mostrando el viejo — sin ningún error visible. Corregido
haciendo que los dos caminos converjan; queda documentado en el código porque
la solución obvia (quitar el inglés) rompe el guardado del panel.

**Colisión de nombres de clase.** El panel del mini programa heredaba el
tamaño de los teléfonos en miniatura del home (34×68 px) y se colapsaba a un
carácter por línea. Apareció midiendo el DOM, no mirando la captura.

---

## 3. Verificación

**65 comprobaciones, todas en verde**, ejecutadas contra el producto en chino
en escritorio (1440 px) y móvil (390 px):

| Batería | Resultado |
|---|---|
| Flujos completos | 34/34 |
| Casos límite y adversarios | 18/18 |
| Panel del comerciante | 10/10 |
| Multicompañía (contraste real con paletas generadas) | 3/3 |

---

## 4. Lo que falta y de qué depende

| Falta | Depende de |
|---|---|
| Pagos reales con 微信支付 / 支付宝 | Credenciales de proveedor de servicios (服务商) |
| Alta de mini programas por API | Certificación como proveedor tercero de Tencent |
| Agentes de IA operando de verdad | Clave del modelo (DeepSeek / Qwen) |
| Publicación con dominio propio en China | **Registro ICP** — ver el punto siguiente |

### El punto que decide el calendario

Del estudio de mercado, verificado: **la licencia ICP comercial solo pueden
obtenerla empresas 100 % chinas o mixtas con inversión extranjera que no
supere el 50 %.** Una empresa de capital totalmente extranjero (WFOE) puede
obtener el registro ICP no comercial, pero no la licencia comercial.

Además, **todos los dominios que use un mini programa deben tener registro
ICP** y cada mini programa necesita su **备案 ante el MIIT**.

Como tu empresa china ya existe, la pregunta concreta para tu abogado es:
**¿qué estructura de capital tiene, y le permite obtener licencia ICP
comercial?** Si la respuesta es no, hay dos caminos —socio chino o alojar
fuera de China continental con las limitaciones que eso implica— y conviene
saberlo antes de invertir en distribución.

El plazo del registro ICP, con la entidad ya constituida, es de **20 a 60 días
hábiles**. Es el camino crítico, no el producto.

---

## 5. Lo que el producto todavía no cubre

- **Alojamiento en China continental.** Hoy la plataforma está en Alemania. El
  registro ICP exige alojar en el continente, y servir tiendas chinas desde
  Europa dará latencia. Migrar a Alibaba Cloud o Tencent Cloud es trabajo
  conocido, pero es trabajo.
- **Equipo local.** Soporte en chino, ventas y la relación con Tencent no son
  producto. Es la brecha más grande que queda.
- **Validación con comerciantes reales** de que el diseño irrepetible y el
  equipo de IA mueven la compra.
