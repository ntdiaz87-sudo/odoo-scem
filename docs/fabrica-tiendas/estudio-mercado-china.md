# Estudio de mercado — China

**Fecha:** 29 de agosto de 2026
**Alcance:** viabilidad y adaptación de producto de `fábrica.` para el mercado
doméstico chino.

> Los datos de esta sección provienen de fuentes públicas consultadas en la
> fecha del documento; las fuentes están enlazadas al final. Lo que no pude
> verificar aparece marcado como tal — no hay cifras inventadas.

---

## 1. El mercado existe y es enorme

| Dato | Cifra | Año |
|---|---|---|
| Volumen transaccionado en Mini Programs de WeChat | **> ¥4,8 billones** (4,8 trillion RMB) | 2025 |
| Usuarios activos mensuales de Mini Programs | **> 945 millones** | 2025 |
| Crecimiento del GMV de WeChat Mini Shop | **×4,3 interanual** | 2025 |
| GMV de WeChat Channels (视频号) | **¥1,5 billones** | 2025 |

**Lectura:** el canal donde queremos jugar no es emergente, es el principal
canal de comercio social del país. El comercio "de dominio privado" (私域) —
que el comerciante controla, frente a alquilar visibilidad en Taobao o JD — es
una categoría establecida, no una apuesta.

---

## 2. Competencia y precios (verificado)

| Competidor | Precio conocido | Notas |
|---|---|---|
| **Weimob (微盟) / Youzan (有赞) / Weidian (微店)** | **SaaS básica ¥7.000/año** (≈ ¥583/mes) | Los tres grandes proveedores terceros de WeChat. Plantillas prefabricadas y funcionalidad estándar |
| **Shoplazza (店匠)** | **28–218 USD/mes** (5 planes) | Enfocado a cross-border |

**Consecuencia directa para nuestro pricing:** una escala de **¥199 / ¥399 /
¥699 al mes** sitúa el plan de entrada en ≈ ¥2.388/año, **aproximadamente un
tercio del precio base de los incumbentes**. Es una entrada agresiva real, no
retórica.

> Corrijo aquí una valoración previa mía: había estimado que ¥199/mes no era
> agresivo. Con el dato de ¥7.000/año de los incumbentes, sí lo es.

---

## 3. Marco regulatorio — las tres puertas

Esto determina qué se puede lanzar y cuándo. Es la parte más importante del
estudio.

### 3.1 Licencia ICP comercial: restringida al capital chino

- El **registro ICP (ICP备案)** es gratuito y obligatorio para todo sitio
  alojado en China continental. **Una empresa de capital 100 % extranjero
  (WFOE) sí puede obtenerlo** para uso no comercial.
- La **licencia ICP comercial** solo pueden obtenerla: (1) empresas 100 %
  chinas, o (2) empresas mixtas donde la inversión extranjera **no supere el
  50 %**.
- Plazos 2026: si la entidad ya existe, el registro ICP tarda **20–60 días
  hábiles**. Desde cero, 3–6 meses.

**Pregunta abierta y decisiva:** ¿tu empresa china es WFOE o tiene socio
chino? De eso depende si puedes obtener licencia ICP comercial. **Es la
primera pregunta para tu abogado**, antes que cualquier otra.

### 3.2 Mini Program: registro obligatorio y dominios con ICP

- **Todos los dominios** que use un Mini Program deben tener **registro ICP
  válido**. No se admiten direcciones IP.
- Desde finales de 2023, **todo Mini Program debe registrarse ante el MIIT
  (小程序备案)**, además del ICP del dominio.

**Consecuencia arquitectónica — y aquí hay una buena noticia:** nuestro diseño
actual, con **un dominio raíz y un subdominio por tienda**, encaja: se registra
el dominio raíz y los subdominios quedan cubiertos. La arquitectura multi-tienda
que ya está construida **no hay que rehacerla**. Lo que cambia es **dónde se
aloja**: China continental en lugar de Alemania.

### 3.3 Modelo de proveedor de servicios (服务商)

- WeChat Pay ofrece **modo institución/proveedor de servicios**: la institución
  se conecta al API, **da de alta sub-comerciantes**, WeChat liquida a la
  institución y esta liquida a cada comerciante. Cada sub-comerciante recibe su
  **Sub-merchant ID**.
- Un **proveedor tercero certificado** puede usar el **registro rápido de Mini
  Programs** (快速注册): el comerciante autoriza con verificación de identidad
  real y el alta tarda alrededor de un minuto.
- Existe además la figura del **Mini Program de prueba (试用小程序)**, útil
  para que el comerciante vea el resultado antes de registrarse formalmente.
- **Límite conocido:** los proveedores terceros no hacen el alta de cuenta ni
  el registro (备案) por el comerciante; eso debe estar hecho antes.

**Consecuencia para el producto:** el modelo 服务商 encaja exactamente con
nuestra arquitectura multi-tienda — **un sub-comerciante por canal de Vendure**.
Es una correspondencia uno a uno con lo que ya existe.

---

## 4. Qué significa todo esto para el producto

| Hallazgo | Qué cambia en el producto |
|---|---|
| 945 M de usuarios en Mini Programs | El Mini Program **no es la fase 2**: es un canal de lanzamiento |
| Dominios de Mini Program exigen ICP | Un dominio raíz registrado + subdominios por tienda (**ya lo tenemos**) |
| Modelo 服务商 con sub-comerciantes | Un sub-comerciante por tienda, mapeado al canal (**ya lo tenemos**) |
| Registro rápido de Mini Program | El alta del canal puede ser de un minuto para el comerciante |
| Mini Program de prueba | El demo puede incluir Mini Program sin registro formal |
| Incumbentes a ¥7.000/año | ¥199/¥399/¥699 al mes es entrada agresiva defendible |
| 私域 es la categoría | El posicionamiento no es "haz tu web": es "tu canal propio" |
| ICP comercial restringido | **Riesgo de estructura societaria: verificar con abogado** |

---

## 5. Lo que este estudio NO resuelve

1. **Si tu sociedad puede obtener licencia ICP comercial** (depende de si es
   WFOE o mixta). Solo un abogado chino lo confirma.
2. **Precios exactos y planes vigentes de Youzan y Weimob** más allá del dato
   de SaaS básica: no publican tarifas completas.
3. **Coste de convertirse en proveedor certificado de WeChat** y plazo.
4. **Coste de adquisición de cliente** por canal en China.
5. **Validación con comerciantes reales** de que la unicidad del diseño y el
   equipo de IA mueven la compra.

---

## Fuentes

- Mini Programs, GMV y usuarios: [E-Commerce China Agency](https://ecommercechinaagency.com/wechat-mini-program-ecommerce-in-2026/), [Tech Buzz China](https://techbuzzchina.substack.com/p/tencents-e-commerce-revival-part-17a)
- Precios de competidores: [AppInChina](https://appinchina.co/blog/the-complete-guide-to-wechat-mini-program-development/), [TrustRadius — Shoplazza](https://www.trustradius.com/products/shoplazza/pricing)
- Licencia y registro ICP: [MS Advisory](https://msadvisory.com/icp-license-china/), [AppInChina](https://appinchina.co/how-can-i-get-an-icp-license-for-china/), [TMO Group](https://www.tmogroup.asia/insights/china-icp-license/)
- Registro de Mini Programs ante MIIT: [MSA Asia](https://msadvisory.com/icp-license-wechat-mini-programs/), [Sekkei Digital Group](https://sekkeidigitalgroup.com/icp-license-for-wechat-mini-programs/)
- Proveedor tercero y registro rápido: [Weixin Open Platform](https://developers.weixin.qq.com/doc/oplatform/en/Third-party_Platforms/2.0/product/how_to_dev.html)
- WeChat Pay modo proveedor y sub-comerciantes: [WeChat Pay Open Platform](https://pay.weixin.qq.com/doc/global/v3/en/4012356412)
