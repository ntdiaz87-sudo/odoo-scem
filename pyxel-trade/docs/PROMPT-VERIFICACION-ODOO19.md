# Prompt de verificación técnica — Odoo 19

> **Cómo usarlo:** copia todo lo que hay bajo la línea y pégalo en otra
> ventana de contexto (Claude o ChatGPT con acceso a web). Pásame su
> respuesta entera.

---

Necesito verificación técnica sobre **Odoo 19**, no orientación general.
Voy a escribir código de producción a partir de tus respuestas, así que la
regla más importante es esta:

**Si no puedes verificar algo, dilo. No supongas, no completes por analogía
con versiones anteriores y no inventes nombres de modelos, campos ni
métodos. Un "no he podido confirmarlo" me sirve; un dato inventado me rompe
el despliegue.**

Marca cada respuesta con: `CONFIRMADO` (con fuente), `PROBABLE` (con el
razonamiento) o `NO VERIFICADO`.

## Contexto

Estoy montando una plataforma B2B sobre Odoo 19 Community, en Docker, tras
un Caddy. Tengo escrito un módulo que extiende `res.partner` y
`product.template`, y que define un modelo propio. Todavía no se ha
ejecutado en ningún sitio.

## Bloque 1 — La imagen de Docker

1. ¿Existe la etiqueta `odoo:19` en Docker Hub? ¿A qué versión exacta
   corresponde hoy y cuál es su fecha de publicación?
2. ¿Qué versiones de PostgreSQL admite Odoo 19? Tengo previsto
   `postgres:16`. ¿Es adecuada?
3. ¿Hay algún cambio conocido en el *entrypoint* de la imagen oficial de
   Odoo 19 respecto a la 17? Concretamente: ¿sigue tomando las credenciales
   de base de datos de las variables de entorno `HOST`, `USER` y `PASSWORD`
   cuando no están en `odoo.conf`?

## Bloque 2 — Modelos y campos que uso

Para cada uno: ¿existe en Odoo 19 Community con ese nombre exacto? Si
cambió, dime el nombre nuevo.

| Uso | Qué necesito confirmar |
|---|---|
| `uom.uom` | ¿Sigue llamándose así? Me consta que la gestión de unidades de medida se reorganizó en alguna versión reciente. ¿En qué módulo vive y cómo se declara un `Many2one` hacia él? |
| `account.incoterms` | ¿Sigue existiendo con ese nombre y en el módulo `account`? |
| `product.template.volume` y `product.template.weight` | ¿Siguen existiendo y en qué unidades? Los necesito para calcular la ocupación de un contenedor |
| `product.supplierinfo` | ¿Sigue siendo el modelo de proveedores de producto, accesible desde `product.template.seller_ids`? ¿Sigue teniendo el campo `delay` como plazo de entrega? |
| `res.country.state` | ¿Sin cambios? |

## Bloque 3 — Sintaxis que puede haber cambiado

1. **`_sql_constraints`.** ¿Sigue aceptándose la lista de tuplas
   `[('code_uniq', 'unique(code)', "mensaje")]` en Odoo 19, o se sustituyó
   por otra API? Si cambió, dame la forma nueva con un ejemplo.
2. **Vistas de lista.** En las vistas XML, ¿la etiqueta es `<list>` o
   `<tree>` en Odoo 19? ¿`<tree>` sigue aceptándose?
3. **Campos calculados almacenados.** ¿Sigue siendo válido
   `fields.Selection(..., compute='_metodo', store=True)` con
   `@api.depends`?
4. ¿Hay algún cambio en la declaración de `__manifest__.py` en Odoo 19
   (claves nuevas, obsoletas o de formato distinto)?
5. ¿Cambió el formato de `security/ir.model.access.csv`?

## Bloque 4 — Rutas HTTP (dependo de ellas para una prueba de humo)

1. ¿La página de acceso sigue en `/web/login`?
2. ¿El gestor de bases de datos sigue en `/web/database/manager`?
3. ¿Los paquetes de estáticos se siguen sirviendo bajo `/web/assets/...`
   con un hash en la URL? Necesito extraer del HTML la URL de la hoja de
   estilos para comprobar que carga.
4. ¿El *websocket* del bus sigue en la ruta `/websocket` y en el puerto
   8072 cuando `workers > 0`?
5. ¿Existe algún endpoint de salud tipo `/web/health`? Si existe, ¿qué
   devuelve?

## Bloque 5 — Módulos estándar disponibles en Community

¿Cuáles de estos existen en Odoo 19 **Community** (no Enterprise)?

`website`, `website_sale`, `sale_management`, `purchase`, `stock`, `crm`,
`account`, `delivery`, `website_sale_wishlist`, `website_sale_comparison`

Marca claramente los que sean sólo Enterprise.

## Bloque 6 — Localización cubana (lo más importante)

Este es el punto que puede bloquear el proyecto entero, así que investiga a
fondo.

Existe una localización cubana para Odoo, `l10n_cu`, con módulos como
`l10n_cu`, `l10n_cu_address`, `l10n_cu_banks` y `l10n_cu_hr`. Conozco el
repositorio `cuba-odoo/l10n-cuba` en GitHub, en estado beta.

1. ¿Existe una versión de `l10n_cu` compatible con **Odoo 19**? ¿En qué
   repositorio y en qué rama?
2. ¿Cuál es la versión más alta de Odoo para la que existe hoy?
3. ¿Está `l10n_cu` incluido en el Odoo oficial, o es exclusivamente
   comunitario?
4. ¿Hay otras localizaciones cubanas mantenidas, aparte de esa?
5. Si sólo existe para versiones anteriores: ¿qué implica migrarla a
   Odoo 19? Enumera los cambios que suelen romper un módulo de
   localización entre versiones mayores.

## Formato de respuesta

Responde por bloques, en el mismo orden y con la misma numeración. Para
cada punto: la etiqueta (`CONFIRMADO` / `PROBABLE` / `NO VERIFICADO`), la
respuesta y la fuente cuando la tengas (documentación oficial, código en
GitHub, notas de la versión). Sin relleno: voy a convertir esto
directamente en código.
