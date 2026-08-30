# Prompt — Despliegue y reconocimiento del GEX44

> **Cómo usarlo:** copia todo lo que hay bajo la línea y pégalo en una
> ventana con acceso SSH al servidor. Devuélveme la salida completa de las
> tres partes.

---

Necesito que ejecutes un reconocimiento y un despliegue en un servidor
Hetzner GEX44 **compartido con otros proyectos en producción**, y que me
devuelvas la salida literal.

## Lo primero: qué puede salir mal

En ese servidor corren ya, al menos, **Qbaprotic** y una **fábrica de
tiendas**. Un error tumba sitios de terceros. Estas reglas no se negocian:

1. **No instales nada sin comprobar antes que no está ya instalado.** Docker
   ya está. Caddy ya está, como servicio del host y no en contenedor.
2. **No toques ningún bloque ajeno del `/etc/caddy/Caddyfile`.** Sólo se
   añade un bloque al final.
3. **`caddy validate` SIEMPRE antes de `systemctl reload`.** Un Caddyfile
   roto deja sin servicio a todos los proyectos del servidor.
4. **Ningún puerto en `0.0.0.0`.** El único proceso que ve Internet es
   Caddy. Los contenedores publican en `127.0.0.1`.
5. **No ejecutes `ufw`, `iptables` ni `docker system prune`.** El
   cortafuegos ya está configurado y prune borraría volúmenes de otros.
6. **Si algo no cuadra con lo que te digo aquí, para y repórtamelo.** No
   improvises sobre un servidor de producción ajeno.

## Contexto

- Servidor: Hetzner GEX44, IP `46.4.98.13`
- Acceso: `ssh gex44`
- Git privado: Gitea en `https://git.enetradex.com`
- DNS: Cloudflare, zona `enetradex.com`
- Proyecto nuevo: **PYXEL Cuba Trade OS**, Odoo 19 en Docker
- Dominio previsto: `trade.enetradex.com`
- Puertos previstos: **8310** (web) y **8311** (websocket), ambos en loopback
- Mapa de puertos conocido, verificado el 2026-08-28 y **que hay que
  reverificar**: 8250 seric (expuesto en 0.0.0.0), 8260 y 8261 la fábrica,
  8300 ocupado

El código del proyecto está en el directorio `pyxel-trade/` del repositorio,
con su propio README. Léelo antes de empezar: contiene el procedimiento
completo.

---

# PARTE 1 — Reconocimiento (solo lectura, obligatoria)

Ejecuta:

```bash
ssh gex44 'bash -s' < pyxel-trade/scripts/recon.sh
```

Devuélveme **la salida íntegra**, sin resumir. Y respóndeme explícitamente:

1. ¿Están **libres** los puertos 8310 y 8311? Si no, dime dos puertos
   libres por encima de 8300 y **no continúes**: tengo que cambiar la
   configuración antes.
2. ¿Hay algún proceso escuchando en `0.0.0.0` además del `seric` conocido
   en 8250?
3. ¿Está `caddy` activo y es del host?
4. ¿Cuánto disco libre y cuánta RAM hay? Odoo 19 con 5 workers más
   PostgreSQL necesita margen y el servidor es compartido.
5. ¿Existe ya `/opt/pyxel-trade`? Si existe, **para**: alguien empezó antes
   y no quiero pisarlo.

**Si algo de lo anterior falla, termina aquí y repórtamelo.** No pases a la
parte 2.

---

# PARTE 2 — Despliegue

Sigue el README de `pyxel-trade/`, que tiene los ocho pasos. Resumen de lo
que hay que hacer:

1. Crear el repositorio `nilo/pyxel-trade` en Gitea, privado, rama por
   defecto `develop`, y subir ahí el contenido de `pyxel-trade/`.
2. Crear la **deploy key de solo lectura** en el servidor
   (`/opt/pyxel-trade_deploy_key`) y darla de alta en Gitea.
3. Clonar en `/opt/pyxel-trade`.
4. Crear el registro DNS en Cloudflare: `A` · `trade` · `46.4.98.13` ·
   **nube GRIS, DNS only**. En naranja, Caddy no consigue certificado: es
   el fallo más repetido de este patrón.
5. Crear `/opt/pyxel-trade/.env` desde `.env.example`, con `chmod 600`, y
   generar las contraseñas con `openssl rand -base64 32` (una distinta para
   `DB_PASSWORD` y para `ODOO_ADMIN_PASSWD`).
6. Renderizar `config/odoo.conf` con `envsubst` desde la plantilla.
7. Levantar la base, crear la base de datos e instalar los módulos:
   ```bash
   $compose run --rm odoo odoo -d "$ODOO_DB" \
       -i base,pyxel_trade_core,pyxel_trade_marketplace --stop-after-init
   ```
8. Añadir el bloque de `infra/caddy-site.conf` al final del Caddyfile,
   **validar** y recargar.

**Devuélveme, pase lo que pase:**

- La salida completa del paso 7. Es la primera vez que estos módulos se
  ejecutan en un Odoo 19 real y **espero errores**. Quiero el traceback
  entero, no un resumen: cada línea me dice qué corregir.
- Los avisos (`WARNING`) del arranque, aunque no rompan nada.
- La salida de `caddy validate`.

**No intentes arreglar los errores del módulo por tu cuenta.** Pásamelos.
Conozco el código y sé qué toca cambiar.

Los puntos donde más probable es que falle, para que no te sorprendan:

- Los `xpath` sobre el `<notebook>` del formulario de contacto y del de
  producto. Si Odoo 19 movió esas vistas, el módulo no instala.
- El campo `website_url` de `product.template`, que uso para enlazar
  productos.
- El parámetro `?category=` del controlador `/shop` de `website_sale`.

---

# PARTE 3 — Verificación y mediciones

## 3.1 Prueba de humo

```bash
cd /opt/pyxel-trade && bash scripts/smoke.sh trade.enetradex.com
```

Comprueba salud del proceso, salud con PostgreSQL, página de acceso, que el
gestor de bases devuelve 404, y que la hoja de estilos **carga de verdad**
— los estáticos rotos dejan la web a medias sin que nada falle.

## 3.2 Peso de la página (esto me hace falta para una decisión de arquitectura)

```bash
cd /opt/pyxel-trade && bash scripts/measure.sh https://trade.enetradex.com/market
```

Devuélveme la tabla completa. **Es el número que decide si el frontend
puede quedarse en Odoo o hay que sacarlo a un cliente propio.** En Cuba el
giga adicional cuesta 18,7 veces más que el del plan base, así que el peso
del paquete de estáticos de Odoo no es un detalle estético.

## 3.3 Websocket

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://trade.enetradex.com/websocket/health
```

## 3.4 Lo que NO se puede medir desde el servidor

La latencia **desde China** hacia el servidor. Necesita un punto de medición
en China: un servicio de comprobación global, o alguien allí. Si tienes
forma de obtenerla, pásamela; si no, dilo y la dejo pendiente.

---

# Qué quiero de vuelta

En este orden, con salidas literales y sin resumir:

1. Salida de `recon.sh` y respuesta a las cinco preguntas de la parte 1.
2. Salida de la instalación de módulos, con **todos** los errores y avisos.
3. Salida de `caddy validate`.
4. Salida de `smoke.sh`.
5. Tabla de `measure.sh`.
6. Código HTTP del websocket.
7. Cualquier cosa que te haya obligado a apartarte de este guion, y por qué.

Si te bloqueas en algún punto, dime **exactamente** dónde y con qué error.
Prefiero un despliegue a medias bien reportado que uno completo sobre un
servidor de terceros que nadie sabe cómo quedó.
